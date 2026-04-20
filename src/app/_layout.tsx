import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar, Linking, Platform, BackHandler, Text as RNText } from 'react-native';
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
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import tamaguiConfig from '../../tamagui.config';
import { queryClient } from '@/services/queryClient';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { ThemeTransitionProvider } from '@/shared/ui/ThemeTransitionProvider';
import i18n from '@/locales'; // i18n 초기화
import { GlobalErrorHandler } from '@/shared/error/GlobalErrorHandler';
import { AppErrorBoundary } from '@/shared/error/AppErrorBoundary';
import { VersionCheckDialog } from '@/shared/ui/VersionCheckDialog';
import { appVersionService } from '@/services/appVersionService';
import { meetsMinVersion, hasNewerVersion } from '@/shared/utils/versionComparator';
import { formatLocalDate } from '@/shared/utils/date';
import { config } from '@/constants/config';
import { APP_STORE_URLS } from '@/constants/appStoreUrls';
import '@/features/admob/config/adInit'; // AdMob SDK 초기화
import { initializeFirebase, enableCrashlytics } from '@/services/firebase'; // Firebase 초기화
import { storage } from '@/services/storage';
import { useFCMLifecycle } from '@/features/settings/hooks/useFCMLifecycle';
import * as Updates from 'expo-updates';

async function migrateTokensToSecureStore() {
  const migrated = await AsyncStorage.getItem('secure_token_migrated');
  if (migrated) return;
  const access = await AsyncStorage.getItem('access_token');
  const refresh = await AsyncStorage.getItem('refresh_token');
  if (access) await SecureStore.setItemAsync('access_token', access);
  if (refresh) await SecureStore.setItemAsync('refresh_token', refresh);
  await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
  await AsyncStorage.setItem('secure_token_migrated', '1');
  console.log('[Migration] AsyncStorage 토큰 → SecureStore 마이그레이션 완료');
}

async function runFCMMigration() {
  const migrated = await storage.get<boolean>('v2_fcm_migrated');
  if (!migrated) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await storage.set('v2_fcm_migrated', true);
    console.log('[Migration] 로컬 알림 → FCM 마이그레이션 완료');
  }
}

async function checkAndApplyUpdate() {
  if (!Updates.isEnabled) return;
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (e) {
    console.warn('[Updates] 업데이트 확인 실패:', e);
  }
}

type VersionCheckType = 'force_update' | 'optional_update' | 'server_down';

interface VersionCheckDialogState {
  visible: boolean;
  type: VersionCheckType | null;
  latestVersion: string;
}

const VERSION_CHECK_STORAGE_KEY = 'app_version_last_check_date';

function RootLayoutNav() {
  const { mode } = useThemeStore();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [splashDone, setSplashDone] = useState(false);
  const [updateChecked, setUpdateChecked] = useState(false);

  const [dialogState, setDialogState] = useState<VersionCheckDialogState>({
    visible: false,
    type: null,
    latestVersion: '',
  });

  const rootBackgroundColor = mode === 'dark' ? '#1C1C1E' : '#FFFFFF';

  const getTodayDateString = (): string => formatLocalDate();

  // Check if version check was already done today
  const wasCheckedToday = async (): Promise<boolean> => {
    try {
      const lastCheckDate = await AsyncStorage.getItem(VERSION_CHECK_STORAGE_KEY);
      if (!lastCheckDate) return false;

      const today = getTodayDateString();
      return lastCheckDate === today;
    } catch (error) {
      console.warn('[Version Check] Failed to read last check date:', error);
      return false;
    }
  };

  // Save today's date as last check date
  const saveCheckDate = async (): Promise<void> => {
    try {
      const today = getTodayDateString();
      await AsyncStorage.setItem(VERSION_CHECK_STORAGE_KEY, today);
      console.log('[Version Check] Saved check date:', today);
    } catch (error) {
      console.warn('[Version Check] Failed to save check date:', error);
    }
  };

  // 앱 시작 시 토큰 확인 + 마이그레이션
  useEffect(() => {
    // SecureStore 마이그레이션 완료 후 auth 초기화 (순서 보장)
    migrateTokensToSecureStore().then(() => initialize());
    initializeFirebase();
    enableCrashlytics();
    runFCMMigration();
    checkAndApplyUpdate().finally(() => setUpdateChecked(true)); // 스플래시 화면 중 OTA 업데이트 체크 및 즉시 적용
  }, []);

  // 앱 시작 시 버전 체크
  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        // 1. Check if already checked today
        const checkedToday = await wasCheckedToday();
        if (checkedToday) {
          console.log('[Version Check] Already checked today, skipping');
          return;
        }

        // 2. Perform version check
        const result = await appVersionService.checkVersion();

        console.log('[Version Check]', {
          currentVersion: config.appVersion,
          serverResponse: result,
          meetsMin: meetsMinVersion(config.appVersion, result.minVersion),
          hasNewer: hasNewerVersion(config.appVersion, result.latestVersion),
        });

        // 3. Determine dialog type (priority order)

        // Priority 1: Server down
        if (!result.serverLive) {
          console.log('[Version Check] -> server_down');
          setDialogState({
            visible: true,
            type: 'server_down',
            latestVersion: result.latestVersion,
          });
          // Don't save check date - will check again on next launch
          return;
        }

        // Priority 2: Force update
        if (!meetsMinVersion(config.appVersion, result.minVersion)) {
          console.log('[Version Check] -> force_update');
          setDialogState({
            visible: true,
            type: 'force_update',
            latestVersion: result.latestVersion,
          });
          // Don't save check date - will check again on next launch
          return;
        }

        // Priority 3: Optional update
        if (hasNewerVersion(config.appVersion, result.latestVersion)) {
          console.log('[Version Check] -> optional_update');
          setDialogState({
            visible: true,
            type: 'optional_update',
            latestVersion: result.latestVersion,
          });
          // Save check date - won't show again today
          await saveCheckDate();
          return;
        }

        console.log('[Version Check] -> no update needed');

      } catch (error) {
        console.warn('[Version Check] Failed:', error);
      }
    };

    checkAppVersion();
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

  useFCMLifecycle();

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

  const handleDialogClose = () => {
    if (dialogState.type === 'optional_update') {
      setDialogState({ visible: false, type: null, latestVersion: '' });
    }
  };

  const handleUpdate = () => {
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URLS.ios : APP_STORE_URLS.android;
    Linking.openURL(storeUrl);

    if (dialogState.type === 'optional_update') {
      setDialogState({ visible: false, type: null, latestVersion: '' });
    }
  };

  const handleServerDownConfirm = () => {
    BackHandler.exitApp();
  };

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
