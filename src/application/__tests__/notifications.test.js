import React from 'react';
import { act, create } from 'react-test-renderer';
import { useNotificationAppIntegration } from '@/application/integrations/notifications/useNotificationAppIntegration';
import { useAnalysisPushPrompt } from '@/application/integrations/analysis-notifications/useAnalysisPushPrompt';
import { useNotificationDeepLink } from '@/features/notifications/hooks/useNotificationDeepLink';
import { useFCMLifecycle } from '@/features/notifications/hooks/useFCMLifecycle';
import { invalidateAnalysisQueries } from '@/features/analysis/public';
import { getNotificationPermissionStatus, requestNotificationPermission } from '@/features/notifications/services/notifications';
import { ensurePushTokenRegistered } from '@/features/notifications/services/pushToken';

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => mockQueryClient }));
jest.mock('@/features/analysis/public', () => ({ invalidateAnalysisQueries: jest.fn() }));
jest.mock('@/features/notifications/hooks/useNotificationDeepLink', () => ({ useNotificationDeepLink: jest.fn() }));
jest.mock('@/features/notifications/hooks/useFCMLifecycle', () => ({ useFCMLifecycle: jest.fn() }));
jest.mock('@/features/notifications/services/notifications', () => ({ getNotificationPermissionStatus: jest.fn(), requestNotificationPermission: jest.fn() }));
jest.mock('@/features/notifications/services/pushToken', () => ({ ensurePushTokenRegistered: jest.fn() }));
jest.mock('@/features/notifications/hooks/useNotificationSettings', () => ({ useAnalysisReportEnabled: () => true }));
jest.mock('@/shared/ui/AlertDialog', () => jest.requireActual('@/shared/ui/AlertDialog/useAlertDialog'));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const mockReplace = jest.fn();
const mockQueryClient = {};
let renderer;
let result;
async function mount(useHook) {
  function Harness() { result = useHook(); return null; }
  await act(async () => { renderer = create(React.createElement(Harness)); });
}
beforeEach(() => { jest.clearAllMocks(); });
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });

it('invalidates analysis data on a background or quit notification tap before routing', async () => {
  await mount(() => useNotificationAppIntegration({ isAuthenticated: true, isAppReady: true }));
  const { onNotificationOpen } = useNotificationDeepLink.mock.calls[0][0];
  onNotificationOpen({ type: 'ANALYSIS_DONE', analysisId: '42' });
  expect(invalidateAnalysisQueries).toHaveBeenCalledWith(mockQueryClient);
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)/analysis/42');
  expect(invalidateAnalysisQueries.mock.invocationCallOrder[0]).toBeLessThan(mockReplace.mock.invocationCallOrder[0]);
});

it('invalidates foreground completion and sends ordinary taps home', async () => {
  await mount(() => useNotificationAppIntegration({ isAuthenticated: true, isAppReady: true }));
  useFCMLifecycle.mock.calls[0][0].onEvent({ type: 'ANALYSIS_DONE' });
  expect(invalidateAnalysisQueries).toHaveBeenCalledTimes(1);
  useNotificationDeepLink.mock.calls[0][0].onNotificationOpen({ type: 'OTHER' });
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  expect(invalidateAnalysisQueries).toHaveBeenCalledTimes(1);
});

it('continues analysis when reading OS permission rejects', async () => {
  getNotificationPermissionStatus.mockRejectedValue(new Error('OS unavailable'));
  await mount(useAnalysisPushPrompt);
  const proceed = jest.fn();
  await act(async () => { await expect(result.runWithPushPrompt(proceed)).resolves.toBeUndefined(); });
  expect(proceed).toHaveBeenCalledTimes(1);
});

it.each(['decline', 'grant', 'deny', 'reject', 'token-failure'])('continues analysis after %s', async (choice) => {
  getNotificationPermissionStatus.mockResolvedValue(false);
  if (choice === 'reject') requestNotificationPermission.mockRejectedValue(new Error('OS unavailable'));
  else requestNotificationPermission.mockResolvedValue(choice !== 'deny');
  ensurePushTokenRegistered.mockResolvedValue(choice !== 'token-failure');
  await mount(useAnalysisPushPrompt);
  const proceed = jest.fn();
  await act(async () => { await result.runWithPushPrompt(proceed); });
  expect(proceed).not.toHaveBeenCalled();
  await act(async () => { await result.dialogProps.buttons[choice === 'decline' ? 0 : 1].onPress(); });
  expect(proceed).toHaveBeenCalledTimes(1);
});
