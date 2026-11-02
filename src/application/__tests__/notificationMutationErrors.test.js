import { QueryObserver } from '@tanstack/react-query';
import { queryClient, configureQueryRuntime } from '@/platform/query/queryClient';
import * as mutations from '@/features/notifications/hooks/mutations/useNotificationMutations';
import { notificationApi } from '@/features/notifications/api/notificationApi';
import { useNotificationStore } from '@/features/notifications/stores/useNotificationStore';
import { refetchStaleMemberMe } from '@/features/member/public';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/shared/stores/useLanguageStore', () => ({ useLanguageStore: {} }));
jest.mock('@/features/member/api/memberApi', () => ({ memberApi: {} }));
jest.mock('@/features/notifications/api/notificationApi', () => ({ notificationApi: {
  upsertSetting: jest.fn(), registerFcmToken: jest.fn(),
} }));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => require('@/platform/query/queryClient').queryClient,
  useMutation: (options) => {
    const client = require('@/platform/query/queryClient').queryClient;
    return client.getMutationCache().build(client, { ...options, retryDelay: 0, gcTime: Infinity });
  },
}));

const key = ['member', 'me'];
const input = { token: 'new-token', alarmTime: '09:00', timezone: 'Asia/Seoul', enabled: false, analysisReportEnabled: false };
const before = { notificationSetting: { enabled: true, alarmTime: '21:00', timezone: 'Asia/Seoul', analysisReportEnabled: true } };
const failure = { status: 0, code: 'UNKNOWN_ERROR', message: 'offline', requestId: '' };
let observer;
let unsubscribe;
let getMe;
let globalError;
beforeEach(() => {
  jest.clearAllMocks();
  useNotificationStore.setState({ fcmToken: 'old-token', analysisReportEnabled: true });
  globalError = jest.fn();
  configureQueryRuntime({ onGlobalError: globalError });
  notificationApi.registerFcmToken.mockResolvedValue(undefined);
  queryClient.setQueryData(key, before);
  getMe = jest.fn();
  observer = new QueryObserver(queryClient, { queryKey: key, queryFn: getMe, staleTime: Infinity, retryDelay: 0 });
  unsubscribe = observer.subscribe(() => {});
});
afterEach(() => { unsubscribe(); queryClient.clear(); });

describe.each([
  mutations.useUpdateNotificationTimeMutation,
  mutations.useEnableNotificationMutation,
  mutations.useDisableNotificationMutation,
  mutations.useUpdateAnalysisReportMutation,
])('%p', (hook) => {
  it('rolls back and reports once without immediately reloading; later re-entry reconciles', async () => {
    notificationApi.upsertSetting.mockRejectedValue(failure);
    getMe.mockRejectedValue(failure);
    await expect(hook().execute(input)).rejects.toEqual(failure);
    await queryClient.getQueryCache().find({ queryKey: key }).promise?.catch(() => {});
    expect(notificationApi.upsertSetting).toHaveBeenCalledTimes(2);
    expect(getMe).not.toHaveBeenCalled();
    expect(globalError).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(key)).toEqual(before);
    expect(queryClient.getQueryState(key).isInvalidated).toBe(true);
    expect(useNotificationStore.getState()).toMatchObject({ fcmToken: 'old-token', analysisReportEnabled: true });

    // A lost response may hide a successful server write. Re-entry must accept server truth.
    const server = { notificationSetting: { ...before.notificationSetting, enabled: false } };
    getMe.mockResolvedValue(server);
    refetchStaleMemberMe(queryClient);
    await queryClient.getQueryCache().find({ queryKey: key }).promise;
    expect(getMe).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(key)).toEqual(server);
    refetchStaleMemberMe(queryClient);
    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it('immediately reloads server state after a successful save', async () => {
    notificationApi.upsertSetting.mockResolvedValue(undefined);
    const server = { notificationSetting: { ...before.notificationSetting, alarmTime: '09:00' } };
    getMe.mockResolvedValue(server);
    await hook().execute(input);
    await queryClient.getQueryCache().find({ queryKey: key }).promise;
    expect(getMe).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(key)).toEqual(server);
    expect(globalError).not.toHaveBeenCalled();
  });
});
