// 플랫폼별 버전 관리
const APP_VERSIONS = {
  ios: {
    version: '0.1.0',
    buildNumber: '1',
  },
  android: {
    version: '0.1.0',
    versionCode: 1,
  },
};

export default {
  expo: {
    name: 'One Question',
    slug: 'one-question',
    version: APP_VERSIONS.ios.version, // 기본값 (Expo에서 요구)
    scheme: 'onequestion',
    orientation: 'portrait',
    icon: './assets/one-question-light.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.onequestion.app',
      buildNumber: APP_VERSIONS.ios.buildNumber,
      // 실제 빌드 시 version은 APP_VERSIONS.ios.version 사용
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/one-question-light.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.onequestion.app',
      versionCode: APP_VERSIONS.android.versionCode,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
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
          },
        },
      ],
    ],
    extra: {
      // Environment variables (can be accessed via expo-constants)
      apiUrl: process.env.API_URL || 'https://api.example.com',
      environment: process.env.NODE_ENV || 'development',
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
