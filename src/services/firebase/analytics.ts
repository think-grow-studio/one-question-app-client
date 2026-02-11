import analytics from '@react-native-firebase/analytics';

/**
 * Firebase Analytics Helper
 *
 * 사용자 행동을 추적하고 분석합니다.
 */

// 화면 조회 추적
export async function logScreenView(screenName: string, screenClass?: string) {
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
}

// 커스텀 이벤트 추적
export async function logEvent(eventName: string, params?: Record<string, any>) {
  await analytics().logEvent(eventName, params);
}

// 사용자 속성 설정
export async function setUserProperty(name: string, value: string) {
  await analytics().setUserProperty(name, value);
}

// 사용자 ID 설정
export async function setUserId(userId: string | null) {
  await analytics().setUserId(userId);
}

// 주요 이벤트들
export const AnalyticsEvents = {
  // 인증
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGN_UP: 'sign_up',

  // 질문
  QUESTION_VIEW: 'question_view',
  QUESTION_ANSWER: 'question_answer',
  QUESTION_SKIP: 'question_skip',

  // 도감
  COLLECTION_VIEW: 'collection_view',
  COLLECTION_FILTER: 'collection_filter',

  // 설정
  SETTINGS_CHANGE_THEME: 'settings_change_theme',
  SETTINGS_CHANGE_LANGUAGE: 'settings_change_language',
  SETTINGS_NOTIFICATION_TOGGLE: 'settings_notification_toggle',

  // 공유
  SHARE: 'share',
  SHARE_SUCCESS: 'share_success',
} as const;
