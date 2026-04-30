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
    // TODO: 백엔드 FCM payload 형식(notification vs data-only) 확정 후 검토 필요.
    // 현재는 foreground 메시지를 항상 scheduleNotificationAsync로 표시.
    // 만약 백엔드가 notification + data 둘 다 보내고, iOS background에서 메시지를
    // 받은 뒤 사용자가 foreground로 진입하는 시나리오에서 중복 표시될 가능성 있음.
    // (data-only 권장 + foreground에서만 표시하는 패턴이 안전)
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
