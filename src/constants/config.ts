import Constants from 'expo-constants';

export const config = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl as string || 'https://api.example.com',
  environment: Constants.expoConfig?.extra?.environment as string || 'development',
  isDev: __DEV__,

  // 앱 버전 (app.config.js의 version 필드)
  appVersion: Constants.expoConfig?.version || '1.0.0',
};
