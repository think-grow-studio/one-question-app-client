require('dotenv').config();

const isPreview = process.env.APP_ENV === 'preview';

const LOCALIZED_NAMES = {
  ko: isPreview ? '질문 하나Preview' : '질문 하나',
  en: isPreview ? '질문 하나Preview' : 'One Question',
  ja: isPreview ? '질문 하나Preview' : 'ひとつの質問',
};

const ENV = {
  preview: {
    name: LOCALIZED_NAMES.ko,
    androidPackage: 'com.onequestion.app.preview',
    iosBundleId: 'com.onequestion.app.preview',
    googleServicesFile: './google-services-preview.json',
  },
  production: {
    name: LOCALIZED_NAMES.ko,
    androidPackage: 'com.onequestion.app',
    iosBundleId: 'com.onequestion.app',
    googleServicesFile: './google-services.json',
  },
}[process.env.APP_ENV ?? 'production'];

// 플랫폼별 버전 관리

const APP_VERSIONS = {
    version: '1.0.0',
    androidVersion: 11,
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
      googleServicesFile: './GoogleService-Info.plist', // Firebase 설정 파일
      // Google Sign-In URL scheme은 @react-native-google-signin plugin이 자동 처리
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
      'expo-web-browser',
      [
        'expo-notifications',
        {
          androidMode: 'exact',
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/crashlytics',
      './plugins/with-modular-headers',
      './plugins/with-localized-app-name',
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: `com.googleusercontent.apps.${(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '').split('.')[0]}`,
        },
      ],
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
          androidAppId:
            process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
            'ca-app-pub-3940256099942544~3347511713',
          iosAppId:
            process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
            'ca-app-pub-3940256099942544~1458002511',
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
