import { Platform } from 'react-native';

// EXPO_PUBLIC_* 변수는 Expo Metro가 번들링 시점에 코드에 직접 인라인 (Expo 공식 권장)
// → Babel 플러그인 의존성 없음, 런타임 타이밍 이슈 없음
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';
export const isAdMobProduction = isProduction;

// v16에서 TestIds가 빈 문자열로 변경되어 Google 공식 테스트 Ad Unit ID를 직접 사용.
// 플랫폼별로 다른 ID를 사용해야 함 (잘못된 platform의 ID 사용 시 publisher 불일치로
// "Publisher data not found / no-fill" 에러 발생).
// 출처: https://developers.google.com/admob/ios/test-ads
//       https://developers.google.com/admob/android/test-ads
const TEST_IDS = Platform.OS === 'ios'
  ? {
      banner: 'ca-app-pub-3940256099942544/2934735716',
      rewarded: 'ca-app-pub-3940256099942544/1712485313',
      interstitial: 'ca-app-pub-3940256099942544/4411468910',
    }
  : {
      banner: 'ca-app-pub-3940256099942544/6300978111',
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
    };

const platformEnv =
  Platform.OS === 'ios'
    ? {
        banner: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID,
        rewarded: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID,
        interstitialSwipe: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_SWIPE_ID,
        interstitialPastQuestion: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_PAST_QUESTION_ID,
        interstitialReload: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_RELOAD_ID,
        interstitialPublicScroll: process.env.EXPO_PUBLIC_ADMOB_IOS_PUBLIC_DAILY_QUESTION_SCROLL_ID,
        interstitialPublicPastAnswer: process.env.EXPO_PUBLIC_ADMOB_IOS_PUBLIC_DAILY_QUESTION_PAST_ANSWER_ID,
      }
    : {
        banner: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
        rewarded: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID,
        interstitialSwipe: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_SWIPE_ID,
        interstitialPastQuestion: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_PAST_QUESTION_ID,
        interstitialReload: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_RELOAD_ID,
        interstitialPublicScroll: process.env.EXPO_PUBLIC_ADMOB_ANDROID_PUBLIC_DAILY_QUESTION_SCROLL_ID,
        interstitialPublicPastAnswer: process.env.EXPO_PUBLIC_ADMOB_ANDROID_PUBLIC_DAILY_QUESTION_PAST_ANSWER_ID,
      };

const envIds = platformEnv;

// production에서만 실제 Ad Unit ID 사용, 그 외(preview/development)에서는 테스트 ID 사용
export const admobUnitIds = {
  banner: isProduction ? (envIds.banner || TEST_IDS.banner) : TEST_IDS.banner,
  rewarded: isProduction ? (envIds.rewarded || TEST_IDS.rewarded) : TEST_IDS.rewarded,
  interstitialSwipe: isProduction ? (envIds.interstitialSwipe || TEST_IDS.interstitial) : TEST_IDS.interstitial,
  interstitialPastQuestion: isProduction ? (envIds.interstitialPastQuestion || TEST_IDS.interstitial) : TEST_IDS.interstitial,
  interstitialReload: isProduction ? (envIds.interstitialReload || TEST_IDS.interstitial) : TEST_IDS.interstitial,
  interstitialPublicScroll: isProduction ? (envIds.interstitialPublicScroll || TEST_IDS.interstitial) : TEST_IDS.interstitial,
  interstitialPublicPastAnswer: isProduction ? (envIds.interstitialPublicPastAnswer || TEST_IDS.interstitial) : TEST_IDS.interstitial,
};

export const admobRequestOptions = {
  requestNonPersonalizedAdsOnly: false,
};

export const isAdMobSupportedPlatform = isMobile;
