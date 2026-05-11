import { Platform } from 'react-native';

// @env는 react-native-dotenv Babel 플러그인이 번들링 시점에 직접 .env 파일을 읽어 인라인함
// (process.env / Constants.expoConfig 타이밍 이슈 없음)
// eslint-disable-next-line import/no-unresolved
import { APP_ENV } from '@env';

const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
const isProduction = APP_ENV === 'production';
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
      }
    : {
        banner: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
        rewarded: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID,
        interstitialSwipe: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_SWIPE_ID,
        interstitialPastQuestion: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_PAST_QUESTION_ID,
        interstitialReload: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_RELOAD_ID,
      };

const envIds = {
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || platformEnv.banner,
  rewarded: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || platformEnv.rewarded,
  interstitialSwipe: platformEnv.interstitialSwipe,
  interstitialPastQuestion: platformEnv.interstitialPastQuestion,
  interstitialReload: platformEnv.interstitialReload,
};

// production에서만 실제 Ad Unit ID 사용, 그 외(preview/development)에서는 테스트 ID 사용
export const admobUnitIds = {
  banner: isProduction ? (envIds.banner || TEST_IDS.banner) : TEST_IDS.banner,
  rewarded: isProduction ? (envIds.rewarded || TEST_IDS.rewarded) : TEST_IDS.rewarded,
  interstitialSwipe: isProduction ? (envIds.interstitialSwipe || TEST_IDS.interstitial) : TEST_IDS.interstitial,
  interstitialPastQuestion: isProduction ? (envIds.interstitialPastQuestion || TEST_IDS.interstitial) : TEST_IDS.interstitial,
  interstitialReload: isProduction ? (envIds.interstitialReload || TEST_IDS.interstitial) : TEST_IDS.interstitial,
};

export const admobRequestOptions = {
  requestNonPersonalizedAdsOnly: false,
};

export const isAdMobSupportedPlatform = isMobile;
