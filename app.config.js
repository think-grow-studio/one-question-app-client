export default {
  expo: {
    name: 'One Question',
    slug: 'one-question',
    version: '0.1.0',
    scheme: 'onequestion',
    orientation: 'portrait',
    icon: './assets/one-question-light.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.onequestion.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/one-question-light.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.onequestion.app',
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
    },
  },
};
