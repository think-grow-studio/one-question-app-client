import { getFCMToken } from '@/platform/firebase';
import { notificationApi } from '@/features/notifications/api/notificationApi';
import { useNotificationStore } from '@/features/notifications/stores/useNotificationStore';

/**
 * FCM 토큰이 서버에 등록되어 있음을 보장한다.
 * 리마인드 설정(enabled)과 무관 — 분석 완료 같은 transactional 푸시를 위해
 * OS 권한이 허용된 시점에 호출한다.
 * store.fcmToken은 "서버 등록 성공한 토큰"만 담는 규약이므로 일치하면 no-op.
 * 실패해도 호출측 흐름(분석 요청 등)을 막지 않도록 false만 반환한다.
 */
export async function ensurePushTokenRegistered(): Promise<boolean> {
  try {
    const token = await getFCMToken();
    if (!token) return false;

    if (useNotificationStore.getState().fcmToken === token) return true;

    await notificationApi.registerFcmToken(token);
    useNotificationStore.getState().setFcmToken(token);
    return true;
  } catch (e) {
    if (__DEV__) {
      console.warn('[PushToken] 토큰 등록 실패:', e);
    }
    return false;
  }
}
