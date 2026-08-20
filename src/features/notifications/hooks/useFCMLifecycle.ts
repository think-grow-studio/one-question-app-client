import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { onFCMMessage, onFCMTokenRefresh } from '@/platform/firebase';
import { useNotificationStore } from '@/features/notifications/stores/useNotificationStore';
import { notificationApi } from '@/features/notifications/api/notificationApi';
import {
  ensureAndroidNotificationChannel,
  NOTIFICATION_CHANNEL_IDS,
} from '@/features/notifications/services/notifications';
import { parseNotificationEvent, type NotificationEvent } from '@/features/notifications/model/notificationEvents';

interface UseFCMLifecycleParams {
  /** 파싱된 push event를 외부(app integration)로 전달. transport 이후의 반응은 호출측 책임. */
  onEvent?: (event: NotificationEvent) => void;
}

/**
 * FCM 앱 라이프사이클 리스너
 * - 토큰 갱신 감지 → 서버 업데이트
 * - iOS foreground 표시: RNFirebase firebase.json presentation option
 * - Android foreground 표시: FCM onMessage를 local notification으로 표시 (타입별 채널 라우팅)
 * - 수신한 push를 typed event로 파싱해 onEvent로 전달 (이 feature는 transport까지만 담당)
 */
export function useFCMLifecycle({ onEvent }: UseFCMLifecycleParams = {}) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    ensureAndroidNotificationChannel();
  }, []);

  useEffect(() => {
    return onFCMMessage(async (remoteMessage) => {
      onEventRef.current?.(parseNotificationEvent(remoteMessage.data));

      if (Platform.OS !== 'android') return;

      const title =
        remoteMessage.notification?.title ??
        (typeof remoteMessage.data?.title === 'string' ? remoteMessage.data.title : undefined);
      const body =
        remoteMessage.notification?.body ??
        (typeof remoteMessage.data?.body === 'string' ? remoteMessage.data.body : undefined);

      if (!title && !body) return;

      const channelId =
        remoteMessage.data?.type === 'ANALYSIS_DONE'
          ? NOTIFICATION_CHANNEL_IDS.analysisReport
          : NOTIFICATION_CHANNEL_IDS.dailyReminder;

      await ensureAndroidNotificationChannel();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title ?? '',
          body: body ?? '',
          data: remoteMessage.data ?? {},
          sound: true,
        },
        trigger: {
          channelId,
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
