import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { onFCMMessage, onFCMTokenRefresh } from '@/services/firebase';
import { queryClient } from '@/services/queryClient';
import { analysisKeys } from '@/features/analysis/hooks/queries/useAnalysisQueries';
import { useNotificationStore } from '@/features/notifications/stores/useNotificationStore';
import { notificationApi } from '@/features/notifications/api/notificationApi';
import {
  ensureAndroidNotificationChannel,
  NOTIFICATION_CHANNEL_IDS,
} from '@/features/notifications/services/notifications';

/**
 * FCM 앱 라이프사이클 리스너
 * - 토큰 갱신 감지 → 서버 업데이트
 * - iOS foreground 표시: RNFirebase firebase.json presentation option
 * - Android foreground 표시: FCM onMessage를 local notification으로 표시 (타입별 채널 라우팅)
 * - 분석 완료(ANALYSIS_DONE) 수신 시 분석 쿼리 무효화 → 화면 어디에 있든 다음 진입에 최신 반영
 */
export function useFCMLifecycle() {
  useEffect(() => {
    ensureAndroidNotificationChannel();
  }, []);

  useEffect(() => {
    return onFCMMessage(async (remoteMessage) => {
      if (remoteMessage.data?.type === 'ANALYSIS_DONE') {
        void queryClient.invalidateQueries({ queryKey: analysisKeys.all });
      }

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
