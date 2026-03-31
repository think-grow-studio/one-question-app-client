import { Platform } from 'react-native';

import { config } from '@/constants/config';

const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
const isProduction = config.environment === 'production';

// v16에서 TestIds가 빈 문자열로 변경되어 Google 공식 테스트 Ad Unit ID를 직접 사용
const TEST_IDS = {
  banner: 'ca-app-pub-3940256099942544/2093032645',
  rewarded: 'ca-app-pub-3940256099942544/5354931055',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
} as const;

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
