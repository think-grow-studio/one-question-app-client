import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { initializeFirebase, enableCrashlytics } from '@/services/firebase';
import { storage } from '@/services/storage';

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

/**
 * 앱 시작 시 1회 실행되는 부트스트랩.
 * - SecureStore 토큰 마이그레이션 완료 후 auth 초기화 (순서 보장)
 * - Firebase / Crashlytics 초기화
 * - 로컬 알림 → FCM 마이그레이션
 * - 스플래시 중 OTA 업데이트 체크 및 즉시 적용 → updateChecked로 스플래시 유지 판단
 */
export function useAppBootstrap(): { updateChecked: boolean } {
  const initialize = useAuthStore((s) => s.initialize);
  const [updateChecked, setUpdateChecked] = useState(false);

  useEffect(() => {
    migrateTokensToSecureStore().then(() => initialize());
    initializeFirebase();
    enableCrashlytics();
    runFCMMigration();
    checkAndApplyUpdate().finally(() => setUpdateChecked(true));
  }, [initialize]);

  return { updateChecked };
}
