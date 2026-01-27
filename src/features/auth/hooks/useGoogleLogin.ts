import { useMutation } from '@tanstack/react-query';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/stores/useAuthStore';
import Constants from 'expo-constants';

// Expo Go에서 OAuth 리다이렉트 처리를 위해 필요
WebBrowser.maybeCompleteAuthSession();

// 환경 변수에서 Client ID 가져오기
const getGoogleClientIds = () => {
  const expoConfig = Constants.expoConfig;
  const extra = expoConfig?.extra || {};

  return {
    webClientId: extra.googleClientIdWeb || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    iosClientId: extra.googleClientIdIos || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: extra.googleClientIdAndroid || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  };
};

export function useGoogleLogin() {
  const { login } = useAuthStore();
  const clientIds = getGoogleClientIds();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: clientIds.webClientId,
    iosClientId: clientIds.iosClientId,
    androidClientId: clientIds.androidClientId,
  });

  const mutation = useMutation({
    mutationFn: async (idToken: string) => {
      const { data } = await authApi.googleLogin({ idToken });
      return data;
    },
    onSuccess: async (data) => {
      await login(data.accessToken, data.refreshToken);
    },
  });

  // OAuth 응답 처리
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        mutation.mutate(authentication.idToken);
      }
    }
  }, [response]);

  const handleLogin = () => {
    promptAsync();
  };

  return {
    mutate: handleLogin,
    isPending: mutation.isPending || (response?.type === 'success' && mutation.isPending),
    isError: mutation.isError,
    error: mutation.error,
    isReady: !!request,
  };
}
