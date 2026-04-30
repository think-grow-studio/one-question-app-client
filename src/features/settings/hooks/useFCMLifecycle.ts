import { useEffect } from 'react';
import { onFCMTokenRefresh } from '@/services/firebase';
import { useNotificationStore } from '@/features/settings/stores/useNotificationStore';
import { notificationApi } from '@/features/settings/api/notificationApi';
import { ensureAndroidNotificationChannel } from '@/features/settings/services/notifications';

/**
 * FCM 앱 라이프사이클 리스너
 * - 토큰 갱신 감지 → 서버 업데이트
 * - 원격 알림 표시는 OS/RNFirebase 네이티브 설정이 담당
 */
export function useFCMLifecycle() {
  useEffect(() => {
    ensureAndroidNotificationChannel();
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
