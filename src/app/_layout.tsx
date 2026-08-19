import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar, Text as RNText } from 'react-native';
import { fontFamily } from '@/shared/theme/typography';

// 앱 시작 시 기본 폰트 적용 (커스텀 폰트가 설정된 경우)
if (fontFamily.regular) {
  const defaultProps = (RNText as any).defaultProps || {};
  (RNText as any).defaultProps = {
    ...defaultProps,
    style: [defaultProps.style, { fontFamily: fontFamily.regular }],
  };
}
import { SplashQuoteScreen } from '@/shared/ui/SplashQuoteScreen';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider, Theme } from 'tamagui';
import tamaguiConfig from '../../tamagui.config';
import { queryClient, configureQueryRuntime } from '@/services/queryClient';
import { configureHttpRuntime } from '@/services/apiClient';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useApiErrorStore } from '@/shared/stores/useApiErrorStore';
import { ThemeTransitionProvider } from '@/shared/ui/ThemeTransitionProvider';
import '@/locales'; // i18n 초기화
import { GlobalErrorHandler } from '@/shared/error/GlobalErrorHandler';
import { AppErrorBoundary } from '@/shared/error/AppErrorBoundary';
import { VersionCheckDialog } from '@/shared/ui/VersionCheckDialog';
import { useAppBootstrap } from '@/shared/hooks/useAppBootstrap';
import { useVersionCheck } from '@/shared/hooks/useVersionCheck';
import '@/features/admob/config/adInit'; // AdMob SDK 초기화
import { useNotificationAppIntegration } from '@/app/integrations/notifications/useNotificationAppIntegration';
import { registerNotificationAuthCleanup } from '@/features/notifications/services/authCleanup';

// 로그아웃/탈퇴 시 FCM 토큰 정리를 auth 스토어에 연결 (모듈 로드 시 1회)
registerNotificationAuthCleanup();

// platform(services)이 shared store를 직접 import하지 않도록 콜백 주입 (모듈 로드 시 1회,
// 첫 요청/에러보다 반드시 먼저 실행돼야 하므로 컴포넌트 밖에서 호출한다)
configureHttpRuntime({
  onUnauthorized: () => useAuthStore.getState().logout(),
});
configureQueryRuntime({
  onGlobalError: (error) => useApiErrorStore.getState().showError(error.message, error.requestId),
});

function RootLayoutNav() {
  const { mode } = useThemeStore();
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [splashDone, setSplashDone] = useState(false);

  const { updateChecked } = useAppBootstrap();
  const { dialogState, handleDialogClose, handleUpdate, handleServerDownConfirm } =
    useVersionCheck();

  // 실제 route tree가 렌더되는 조건과 동일해야 한다 (아래 스플래시 게이트 참고) —
  // splashDone만으로는 updateChecked 대기 중에도 준비된 것으로 착각해 quit-state 알림 처리가
  // route tree가 없는 시점에 실행될 수 있다.
  const isAppReady = !isLoading && splashDone && updateChecked;

  useNotificationAppIntegration({ isAuthenticated, isAppReady });

  const rootBackgroundColor = mode === 'dark' ? '#1C1C1E' : '#FFFFFF';

  // 인증 상태에 따라 리다이렉트
  useEffect(() => {
    if (isLoading || !splashDone) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, splashDone, segments]);

  // 로딩 중이거나 스플래시가 끝나지 않았을 때
  if (isLoading || !splashDone || !updateChecked) {
    return <SplashQuoteScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: rootBackgroundColor },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="answer/index"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            // iOS swipe-down dismiss 차단 — 작성 중 실수로 시트 닫혀 답변 날아가는 사고 방지.
            // 닫기는 명시적 X 버튼으로만 (Android와 동작 일치).
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="feed/[id]"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
      <GlobalErrorHandler />
      <VersionCheckDialog
        visible={dialogState.visible}
        type={dialogState.type}
        latestVersion={dialogState.latestVersion}
        onClose={handleDialogClose}
        onUpdate={handleUpdate}
        onServerDownConfirm={handleServerDownConfirm}
      />
    </>
  );
}

export default function RootLayout() {
  const { mode } = useThemeStore();
  const rootBackgroundColor = mode === 'dark' ? '#1C1C1E' : '#FFFFFF';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBackgroundColor }}>
      <AppErrorBoundary>
        <TamaguiProvider config={tamaguiConfig}>
          <Theme name={mode}>
            <ThemeTransitionProvider>
              <QueryClientProvider client={queryClient}>
                <RootLayoutNav />
              </QueryClientProvider>
            </ThemeTransitionProvider>
          </Theme>
        </TamaguiProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
