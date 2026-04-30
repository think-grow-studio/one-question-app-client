const path = require('path');
const envFile = process.env.APP_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, envFile) });

const isPreview = process.env.APP_ENV === 'preview';
const isProduction = process.env.APP_ENV === 'production';

// Google 공식 테스트 App ID (production 외 환경에서 사용)
// adUnits.ts의 TEST_IDS(테스트 Ad Unit ID)와 동일 publisher(Google)이어야
// "Publisher data not found / no-fill" 에러를 방지할 수 있음.
const TEST_ADMOB_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

const LOCALIZED_NAMES = {
  ko: isPreview ? '질문 하나Preview' : '질문 하나',
  en: isPreview ? '질문 하나Preview' : 'One Question',
  ja: isPreview ? '질문 하나Preview' : 'ひとつの質問',
};

const ENV = {
  preview: {
    name: LOCALIZED_NAMES.ko,
    androidPackage: 'com.onequestion.app.preview',
    // iOS preview는 prod와 동일하게 운용 (별도 Bundle ID/Apple Sign-In/APNs 키 관리 회피)
    iosBundleId: 'org.onequestion.app',
    googleServicesFile: './google-services-preview.json',
    iosGoogleServicesFile: './GoogleService-Info.plist',
  },
  production: {
    name: LOCALIZED_NAMES.ko,
    androidPackage: 'com.onequestion.app',
    iosBundleId: 'org.onequestion.app',
    googleServicesFile: './google-services.json',
    iosGoogleServicesFile: './GoogleService-Info.plist',
  },
}[process.env.APP_ENV ?? 'production'];

// 플랫폼별 버전 관리

// buildNumber(iOS) / versionCode(Android)는 EAS 서버가 관리.
// (eas.json의 appVersionSource: "remote" + autoIncrement: true)
// 매 빌드마다 자동으로 +1 되므로 아래 androidVersion / iosVersion 값은 무시됨. 수동 수정 불필요.
const APP_VERSIONS = {
    version: '1.0.3',
    androidVersion: 1,
    iosVersion: '1',
};

export default {
  expo: {
    name: ENV.name,
    slug: 'one-question',
    version: APP_VERSIONS.version, // 기본값 (Expo에서 요구)
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/d2581480-0979-4cc5-9dac-01c48af69bf2',
    },
    scheme: 'onequestion',
    orientation: 'portrait',
    icon: './assets/one-question-light.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    locales: {
      ko: { ios: { CFBundleDisplayName: LOCALIZED_NAMES.ko, CFBundleName: LOCALIZED_NAMES.ko } },
      en: { ios: { CFBundleDisplayName: LOCALIZED_NAMES.en, CFBundleName: LOCALIZED_NAMES.en } },
      ja: { ios: { CFBundleDisplayName: LOCALIZED_NAMES.ja, CFBundleName: LOCALIZED_NAMES.ja } },
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: ENV.iosBundleId,
      buildNumber: APP_VERSIONS.iosVersion,
      googleServicesFile: ENV.iosGoogleServicesFile,
      usesAppleSignIn: true,
      infoPlist: {
        NSUserTrackingUsageDescription:
          '맞춤형 광고를 제공하기 위해 사용됩니다. 이 정보는 광고 측정에만 사용됩니다.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/one-question-light.png',
        backgroundColor: '#ffffff',
      },
      package: ENV.androidPackage,
      versionCode: APP_VERSIONS.androidVersion,
      enableProguardInReleaseBuilds: true,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      googleServicesFile: ENV.googleServicesFile,
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-secure-store',
      'expo-web-browser',
      [
        'expo-notifications',
        {
          androidMode: 'exact',
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/crashlytics',
      '@react-native-firebase/auth',
      '@react-native-firebase/messaging',
      './plugins/with-rnfirebase-static-framework',
      './plugins/with-localized-app-name',
      '@react-native-google-signin/google-signin',
      'expo-apple-authentication',
      'expo-tracking-transparency',
      [
        'expo-splash-screen',
        {
          image: './assets/one-question-light.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            image: './assets/one-question-dark.png',
            backgroundColor: '#1C1C1E',
          },
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            newArchEnabled: true,
            useFrameworks: 'static',
            buildReactNativeFromSource: true,
            forceStaticLinking: [
              'RNFBApp',
              'RNFBAnalytics',
              'RNFBAuth',
              'RNFBCrashlytics',
              'RNFBMessaging',
            ],
          },
          android: {
            newArchEnabled: true,
            usesCleartextTraffic: true,// access HTTP , not secure
          },
        },
      ],
      [
        './plugins/with-google-mobile-ads',
        {
          // production만 실제 App ID 사용 — 그 외 환경은 테스트 App ID로 강제하여
          // adUnits.ts의 TEST_IDS와 publisher를 일치시킴 (no-fill 에러 방지).
          androidAppId: isProduction
            ? (process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || TEST_ADMOB_APP_IDS.android)
            : TEST_ADMOB_APP_IDS.android,
          iosAppId: isProduction
            ? (process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || TEST_ADMOB_APP_IDS.ios)
            : TEST_ADMOB_APP_IDS.ios,
        },
      ],
    ],
    extra: {
      apiUrl: process.env.API_URL || 'https://dev.one-question.org',
      environment: process.env.APP_ENV ?? 'production',
      // Google OAuth Client IDs
      googleClientIdWeb: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
      googleClientIdIos: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
      googleClientIdAndroid: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
      eas: {
        projectId: 'd2581480-0979-4cc5-9dac-01c48af69bf2',
      },
    },
  },
};
