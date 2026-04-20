import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

/**
 * FCM 토큰 발급
 * 시뮬레이터에서는 null 반환 (FCM은 실기기에서만 작동)
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log('[FCM] Token:', token);
    return token;
  } catch (error) {
    console.error('[FCM] 토큰 발급 실패:', error);
    return null;
  }
}

/**
 * FCM 토큰 갱신 리스너
 * 토큰이 변경될 때 호출됨 (앱 재설치, OS 업데이트 등)
 * @returns unsubscribe 함수
 */
export function onFCMTokenRefresh(callback: (token: string) => void): () => void {
  return messaging().onTokenRefresh(callback);
}

/**
 * 포그라운드 FCM 메시지 리스너
 * 백그라운드/종료 상태에서는 시스템이 자동으로 알림 표시
 * @returns unsubscribe 함수
 */
export function onFCMMessage(
  callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
): () => void {
  return messaging().onMessage(callback);
}
