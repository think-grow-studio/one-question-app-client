import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider, Theme } from 'tamagui';
import * as Notifications from 'expo-notifications';
import tamaguiConfig from '../../tamagui.config';
import { queryClient } from '@/services/queryClient';
import { useThemeStore } from '@/stores/useThemeStore';
import { ThemeTransitionProvider } from '@/shared/ui/ThemeTransitionProvider';
import '@/locales'; // i18n 초기화
import { GlobalErrorHandler } from '@/shared/error/GlobalErrorHandler';

export default function RootLayout() {
  const { mode } = useThemeStore();
  const router = useRouter();

  // 알림 클릭 시 홈으로 이동
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        router.replace('/(tabs)');
      }
    );

    return () => subscription.remove();
  }, [router]);

  const rootBackgroundColor = mode === 'dark' ? '#1C1C1E' : '#FFFFFF';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBackgroundColor }}>
      <TamaguiProvider config={tamaguiConfig}>
        <Theme name={mode}>
          <ThemeTransitionProvider>
            <StatusBar
              barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
            />
            <QueryClientProvider client={queryClient}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: rootBackgroundColor },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="answer"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
              </Stack>
              <GlobalErrorHandler />
            </QueryClientProvider>
          </ThemeTransitionProvider>
        </Theme>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
