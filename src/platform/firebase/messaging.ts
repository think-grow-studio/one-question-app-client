import messaging, { type RemoteMessage } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

const FCM_TOKEN_RETRY_COUNT = 3;
const FCM_TOKEN_RETRY_DELAY_MS = 1000;

/**
 * iOS APNS 토큰을 명시적으로 등록.
 * 자동 등록이 기본이지만, 첫 실행 직후엔 race condition으로 APNS 토큰이
 * 준비되기 전에 getToken()이 호출될 수 있어 안전망으로 명시 호출한다.
 * (Android는 APNS 개념이 없으므로 호출 안 함)
 */
async function ensureIOSAPNSRegistration(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] APNS 등록 실패 (계속 진행):', error);
    }
  }
}

/**
 * FCM 토큰 발급.
 * - iOS: APNS 토큰 등록 보장 후 최대 3회 재시도 (race 흡수)
 * - Android: 단순 호출 (보통 첫 시도에 성공)
 * - 시뮬레이터/실기기 미등록 등으로 실패 시 null 반환
 */
export async function getFCMToken(): Promise<string | null> {
  await ensureIOSAPNSRegistration();

  for (let attempt = 0; attempt < FCM_TOKEN_RETRY_COUNT; attempt++) {
    try {
      const token = await messaging().getToken();
      if (token) return token;
    } catch (error) {
      if (__DEV__) {
        console.warn(`[FCM] getToken 시도 ${attempt + 1} 실패:`, error);
      }
    }
    if (attempt < FCM_TOKEN_RETRY_COUNT - 1) {
      await new Promise((resolve) => setTimeout(resolve, FCM_TOKEN_RETRY_DELAY_MS));
    }
  }

  return null;
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
 * Foreground FCM listener.
 * Android needs this to bridge foreground remote messages into a local notification.
 */
export function onFCMMessage(callback: (message: RemoteMessage) => void): () => void {
  return messaging().onMessage(callback);
}

/**
 * Background 상태에서 FCM 알림 탭으로 앱이 열렸을 때.
 * FCM SDK가 직접 표시한 알림은 expo-notifications response listener에 잡히지 않으므로
 * RNFirebase 경로를 별도로 구독해야 한다.
 * @returns unsubscribe 함수
 */
export function onFCMNotificationOpened(
  callback: (message: RemoteMessage) => void,
): () => void {
  return messaging().onNotificationOpenedApp(callback);
}

/**
 * 종료(quit) 상태에서 FCM 알림 탭으로 앱이 시작됐을 때의 메시지.
 * 앱 시작 후 1회만 값이 있고, 이후 호출은 null.
 */
export function getInitialFCMNotification(): Promise<RemoteMessage | null> {
  return messaging().getInitialNotification();
}
