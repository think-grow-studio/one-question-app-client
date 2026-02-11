import crashlytics from '@react-native-firebase/crashlytics';

/**
 * Firebase Crashlytics Helper
 *
 * 앱 크래시 및 오류를 추적합니다.
 */

// Crashlytics 활성화
export async function enableCrashlytics() {
  await crashlytics().setCrashlyticsCollectionEnabled(true);
}

// 사용자 ID 설정
export async function setCrashlyticsUserId(userId: string | null) {
  await crashlytics().setUserId(userId || 'anonymous');
}

// 사용자 속성 설정
export async function setCrashlyticsAttribute(key: string, value: string) {
  await crashlytics().setAttribute(key, value);
}

// 커스텀 로그 기록
export function logCrashlytics(message: string) {
  crashlytics().log(message);
}

// 치명적이지 않은 에러 기록
export function recordError(error: Error, context?: string) {
  if (context) {
    crashlytics().log(`Context: ${context}`);
  }
  crashlytics().recordError(error);
}

// 테스트 크래시 (개발 시 테스트용)
export function testCrash() {
  crashlytics().crash();
}
