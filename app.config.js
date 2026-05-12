// app.config.js는 env에 의존하지 않는다 — 평가 시점/타이밍 quirk와 분리.
// Ad Unit ID 등 런타임 값은 .env(.production)를 통해 Metro가 EXPO_PUBLIC_*로 inline.

const appEnv = process.env.APP_ENV === 'production' ? 'production' : 'preview';
const isPreview = appEnv === 'preview';
const isProduction = appEnv === 'production';

// AdMob App ID는 코드에 박는다 (publisher ID는 빌드 산출물에 평문으로 노출되므로
// 비밀이 아님). production은 실제 App ID, 그 외 환경은 Google 공식 테스트 App ID.
// 테스트 App ID는 adUnits.ts의 TEST_IDS와 publisher(Google)를 일치시켜 no-fill 방지.
const PRODUCTION_ADMOB_APP_IDS = {
  android: 'ca-app-pub-3306112973611341~9359454301',
  ios: 'ca-app-pub-3306112973611341~2078867684',
};
const TEST_ADMOB_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};
const ADMOB_APP_IDS = isProduction ? PRODUCTION_ADMOB_APP_IDS : TEST_ADMOB_APP_IDS;

// Google OAuth Client IDs — 환경별로 다르지 않고, publicly visible identifier라 비밀 아님.
// (실제 비밀은 client_secret이며 클라이언트에 둘 일 없음. 백엔드만 사용.)
const GOOGLE_CLIENT_IDS = {
  web: '414345295903-18bi0jgjfskfdleb8h85o9t1oms71pgh.apps.googleusercontent.com',
  ios: '414345295903-m4duf6ondgto532r6davv25qirummlj2.apps.googleusercontent.com',
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
}[appEnv];

// Build-time diagnostic — emitted to stderr on every config evaluation.
// Shows up in `eas build --local` prebuild logs and `expo export` runs.
process.stderr.write(
  `[app.config.js] appEnv=${appEnv} ` +
    `iosBundleId=${ENV.iosBundleId} ` +
    `nodeEnv=${process.env.NODE_ENV || '(unset)'} ` +
    `iosBanner=${process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID || '(unset)'}\n`,
);

// 플랫폼별 버전 관리

// buildNumber(iOS) / versionCode(Android)는 EAS 서버가 관리.
// (eas.json의 appVersionSource: "remote" + autoIncrement: true)
// 매 빌드마다 자동으로 +1 되므로 아래 androidVersion / iosVersion 값은 무시됨. 수동 수정 불필요.
const APP_VERSIONS = {
    version: '1.0.5',
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
          androidAppId: ADMOB_APP_IDS.android,
          iosAppId: ADMOB_APP_IDS.ios,
        },
      ],
    ],
    extra: {
      apiUrl: process.env.API_URL || 'https://dev.one-question.org',
      environment: appEnv,
      googleClientIdWeb: GOOGLE_CLIENT_IDS.web,
      googleClientIdIos: GOOGLE_CLIENT_IDS.ios,
      eas: {
        projectId: 'd2581480-0979-4cc5-9dac-01c48af69bf2',
      },
    },
  },
};
