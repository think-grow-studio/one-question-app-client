import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { onFCMMessage, onFCMTokenRefresh } from '@/services/firebase';
import { useNotificationStore } from '@/features/settings/stores/useNotificationStore';
import { notificationApi } from '@/features/settings/api/notificationApi';
import { ensureAndroidNotificationChannel } from '@/features/settings/services/notifications';

const ANDROID_NOTIFICATION_CHANNEL_ID = 'daily-reminder';

/**
 * FCM 앱 라이프사이클 리스너
 * - 토큰 갱신 감지 → 서버 업데이트
 * - iOS foreground 표시: RNFirebase firebase.json presentation option
 * - Android foreground 표시: FCM onMessage를 local notification으로 표시
 */
export function useFCMLifecycle() {
  useEffect(() => {
    ensureAndroidNotificationChannel();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    return onFCMMessage(async (remoteMessage) => {
      const title =
        remoteMessage.notification?.title ??
        (typeof remoteMessage.data?.title === 'string' ? remoteMessage.data.title : undefined);
      const body =
        remoteMessage.notification?.body ??
        (typeof remoteMessage.data?.body === 'string' ? remoteMessage.data.body : undefined);

      if (!title && !body) return;

      await ensureAndroidNotificationChannel();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title ?? '',
          body: body ?? '',
          data: remoteMessage.data ?? {},
          sound: true,
        },
        trigger: {
          channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
        },
      });
    });
  }, []);

  useEffect(() => {
    return onFCMTokenRefresh(async (newToken) => {
      const { fcmToken: currentToken, setFcmToken } = useNotificationStore.getState();
      if (!currentToken) return;
      try {
        await notificationApi.registerFcmToken(newToken);
        setFcmToken(newToken);
      } catch {
        // 다음 실행 시 재시도
      }
    });
  }, []);
}
