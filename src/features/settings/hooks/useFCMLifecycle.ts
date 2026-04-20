import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { onFCMTokenRefresh, onFCMMessage } from '@/services/firebase';
import { useNotificationStore } from '@/features/settings/stores/useNotificationStore';
import { notificationApi } from '@/features/settings/api/notificationApi';

/**
 * FCM 앱 라이프사이클 리스너
 * - 토큰 갱신 감지 → 서버 업데이트
 * - 포그라운드 메시지 수신 → 알림 표시
 * 백그라운드/종료 상태는 시스템이 자동 처리
 */
export function useFCMLifecycle() {
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

  useEffect(() => {
    return onFCMMessage(async (remoteMessage) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title ?? '',
          body: remoteMessage.notification?.body ?? '',
          sound: true,
          ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
        },
        trigger: null,
      });
    });
  }, []);
}
