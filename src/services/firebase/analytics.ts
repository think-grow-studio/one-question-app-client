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
  // 인증 (User Lifecycle)
  LOGIN: 'login',
  LOGOUT: 'logout',
  ACCOUNT_DELETE: 'account_delete',
  GUEST_LOGIN: 'guest_login',
  LINK_GOOGLE_START: 'link_google_start',
  LINK_GOOGLE_SUCCESS: 'link_google_success',
  LINK_GOOGLE_FAIL: 'link_google_fail',

  // 화면 조회 (Navigation)
  SCREEN_VIEW: 'screen_view',

  // 질문 (Content Engagement)
  QUESTION_VIEW: 'question_view',
  RANDOM_QUESTION_TODAY: 'random_question_today',
  RANDOM_QUESTION_PAST: 'random_question_past',
  RANDOM_QUESTION_RELOAD: 'random_question_reload',
  PAST_QUESTION_CLICK: 'past_question_click',

  // 답변 (Content Engagement)
  ANSWER_START: 'answer_start',
  ANSWER_SUBMIT: 'answer_submit',
  ANSWER_EDIT: 'answer_edit',

  // 광고 (Monetization)
  AD_IMPRESSION: 'ad_impression',
  AD_CLICK: 'ad_click',
  REWARDED_AD_REQUEST: 'rewarded_ad_request',
  REWARDED_AD_VIEW: 'rewarded_ad_view',
  REWARDED_AD_SKIP: 'rewarded_ad_skip',
  INTERSTITIAL_AD_SHOW: 'interstitial_ad_show',
  INTERSTITIAL_AD_CLOSE: 'interstitial_ad_close',

  // 설정 (Settings)
  THEME_CHANGE: 'theme_change',
  LANGUAGE_CHANGE: 'language_change',
  NOTIFICATION_TOGGLE: 'notification_toggle',
  DATE_PICKER_OPEN: 'date_picker_open',
} as const;
