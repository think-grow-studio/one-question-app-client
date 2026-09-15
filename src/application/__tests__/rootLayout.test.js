import React from 'react';
import { act, create } from 'react-test-renderer';
import RootLayout from '@/app/_layout';
import { configureHttpRuntime } from '@/platform/http/apiClient';

const mockReplace = jest.fn();
let mockUpdateChecked = false;
const mockCleanup = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }), useSegments: () => ['(tabs)'],
  Stack: Object.assign(({ children }) => children, { Screen: () => null }),
}));
jest.mock('@/shared/stores/useAuthStore', () => ({ useAuthStore: Object.assign(
  () => ({ isAuthenticated: false, isLoading: false }),
  { getState: () => ({ cleanupLocalAuth: mockCleanup }) },
) }));
jest.mock('@/shared/stores/useThemeStore', () => ({ useThemeStore: () => ({ mode: 'light' }) }));
jest.mock('@/shared/stores/useApiErrorStore', () => ({ useApiErrorStore: { getState: () => ({ showError: jest.fn() }) } }));
jest.mock('@/application/bootstrap/useAppBootstrap', () => ({ useAppBootstrap: () => ({ updateChecked: mockUpdateChecked }) }));
jest.mock('@/application/bootstrap/useVersionCheck', () => ({ useVersionCheck: () => ({ dialogState: {} }) }));
jest.mock('@/application/integrations/notifications/useNotificationAppIntegration', () => ({ useNotificationAppIntegration: jest.fn() }));
jest.mock('@/features/notifications/services/authCleanup', () => ({ registerNotificationAuthCleanup: jest.fn() }));
jest.mock('@/features/admob/config/adInit', () => ({}));
jest.mock('@/platform/http/apiClient', () => ({ configureHttpRuntime: jest.fn() }));
jest.mock('@/platform/query/queryClient', () => ({ queryClient: {}, configureQueryRuntime: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ QueryClientProvider: ({ children }) => children }));
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: ({ children }) => children }));
jest.mock('tamagui', () => ({ TamaguiProvider: ({ children }) => children, Theme: ({ children }) => children }));
jest.mock('../../../tamagui.config', () => ({}));
jest.mock('@/shared/ui/ThemeTransitionProvider', () => ({ ThemeTransitionProvider: ({ children }) => children }));
jest.mock('@/shared/error/AppErrorBoundary', () => ({ AppErrorBoundary: ({ children }) => children }));
jest.mock('@/shared/error/GlobalErrorHandler', () => ({ GlobalErrorHandler: () => null }));
jest.mock('@/shared/ui/VersionCheckDialog', () => ({ VersionCheckDialog: () => null }));
jest.mock('@/shared/ui/SplashQuoteScreen', () => ({ SplashQuoteScreen: (props) => require('react').createElement('Splash', props) }));
jest.mock('@/locales', () => ({}));

it('waits for OTA and the route tree before the auth redirect', async () => {
  let renderer;
  try {
    await act(async () => { renderer = create(React.createElement(RootLayout)); });
    await act(async () => { renderer.root.findByType('Splash').props.onFinish(); });
    expect(mockReplace).not.toHaveBeenCalled();
    mockUpdateChecked = true;
    await act(async () => { renderer.update(React.createElement(RootLayout)); });
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  } finally {
    await act(async () => { renderer?.unmount(); });
  }
});

it('wires expired sessions to local cleanup before rendering', async () => {
  await configureHttpRuntime.mock.calls[0][0].onUnauthorized();
  expect(mockCleanup).toHaveBeenCalledTimes(1);
});
