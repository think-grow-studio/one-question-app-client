import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider, Theme } from 'tamagui';
import * as Notifications from 'expo-notifications';
import tamaguiConfig from '../../tamagui.config';
import { queryClient } from '@/services/queryClient';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { ThemeTransitionProvider } from '@/shared/ui/ThemeTransitionProvider';
import '@/locales'; // i18n 초기화
import { GlobalErrorHandler } from '@/shared/error/GlobalErrorHandler';

function RootLayoutNav() {
  const { mode } = useThemeStore();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const rootBackgroundColor = mode === 'dark' ? '#1C1C1E' : '#FFFFFF';

  // 앱 시작 시 토큰 확인
  useEffect(() => {
    initialize();
  }, []);

  // 알림 클릭 시 홈으로 이동 (인증된 경우만)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        }
      }
    );

    return () => subscription.remove();
  }, [router, isAuthenticated]);

  // 인증 상태에 따라 리다이렉트
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // 로딩 중일 때 스플래시 표시
  if (isLoading) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: rootBackgroundColor }]}>
        <ActivityIndicator size="large" color={mode === 'dark' ? '#FFFFFF' : '#000000'} />
      </View>
    );
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
          }}
        />
      </Stack>
      <GlobalErrorHandler />
    </>
  );
}

export default function RootLayout() {
  const { mode } = useThemeStore();
  const rootBackgroundColor = mode === 'dark' ? '#1C1C1E' : '#FFFFFF';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBackgroundColor }}>
      <TamaguiProvider config={tamaguiConfig}>
        <Theme name={mode}>
          <ThemeTransitionProvider>
            <QueryClientProvider client={queryClient}>
              <RootLayoutNav />
            </QueryClientProvider>
          </ThemeTransitionProvider>
        </Theme>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
