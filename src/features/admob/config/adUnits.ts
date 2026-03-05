import { Platform } from 'react-native';

const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// v16에서 TestIds가 빈 문자열로 변경되어 Google 공식 테스트 Ad Unit ID를 직접 사용
const TEST_IDS = {
  banner: 'ca-app-pub-3940256099942544/2093032645',
  rewarded: 'ca-app-pub-3940256099942544/5354931055',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
} as const;

const envIds = {
  banner:
    process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ||
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID ||
    process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID,
  rewarded:
    process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ||
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID ||
    process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID,
  interstitial:
    process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ||
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID ||
    process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID,
};

// 실제 Ad Unit ID 사용 (환경변수 없으면 테스트 ID 폴백)
export const admobUnitIds = {
  banner: envIds.banner || TEST_IDS.banner,
  rewarded: envIds.rewarded || TEST_IDS.rewarded,
  interstitial: envIds.interstitial || TEST_IDS.interstitial,
};

export const admobRequestOptions = {
  requestNonPersonalizedAdsOnly: false,
};

export const isAdMobSupportedPlatform = isMobile;
