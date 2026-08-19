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
import { queryClient } from '@/services/queryClient';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { ThemeTransitionProvider } from '@/shared/ui/ThemeTransitionProvider';
import '@/locales'; // i18n 초기화
import { GlobalErrorHandler } from '@/shared/error/GlobalErrorHandler';
import { AppErrorBoundary } from '@/shared/error/AppErrorBoundary';
import { VersionCheckDialog } from '@/shared/ui/VersionCheckDialog';
import { useAppBootstrap } from '@/shared/hooks/useAppBootstrap';
import { useVersionCheck } from '@/shared/hooks/useVersionCheck';
import '@/features/admob/config/adInit'; // AdMob SDK 초기화
import { useNotificationAppIntegration } from '@/app/integrations/notifications/useNotificationAppIntegration';
import { useNotificationDeepLink } from '@/features/notifications/hooks/useNotificationDeepLink';
import { registerNotificationAuthCleanup } from '@/features/notifications/services/authCleanup';

// 로그아웃/탈퇴 시 FCM 토큰 정리를 auth 스토어에 연결 (모듈 로드 시 1회)
registerNotificationAuthCleanup();

function RootLayoutNav() {
  const { mode } = useThemeStore();
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [splashDone, setSplashDone] = useState(false);

  const { updateChecked } = useAppBootstrap();
  const { dialogState, handleDialogClose, handleUpdate, handleServerDownConfirm } =
    useVersionCheck();

  useNotificationAppIntegration();
  useNotificationDeepLink({ isAuthenticated, isAppReady: splashDone });

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
