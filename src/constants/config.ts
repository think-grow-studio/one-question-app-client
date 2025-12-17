import Constants from 'expo-constants';

export const config = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl as string || 'https://api.example.com',
  environment: Constants.expoConfig?.extra?.environment as string || 'development',
  isDev: __DEV__,
};
