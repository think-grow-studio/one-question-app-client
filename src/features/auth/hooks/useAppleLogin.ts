import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { AppleAuthRequest } from '@/shared/types/api';

export function useAppleLogin() {
  const { login } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async (params: AppleAuthRequest) => {
      const { data } = await authApi.appleLogin(params);
      return data;
    },
    onSuccess: async (data) => {
      await login(data.accessToken, data.refreshToken);
    },
  });

  const handleLogin = async () => {
    if (Platform.OS !== 'ios') {
      console.warn('[AppleSignIn] iOS only');
      return;
    }

    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        console.warn('[AppleSignIn] Not available on this device (requires iOS 13+)');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        console.warn('[AppleSignIn] No identityToken in credential');
        return;
      }

      // Apple은 최초 1회에만 fullName을 반환함. 이후 로그인에서는 null.
      const name =
        [credential.fullName?.familyName, credential.fullName?.givenName]
          .filter(Boolean)
          .join(' ')
          .trim() || undefined;

      mutation.mutate({
        identityToken: credential.identityToken,
        name,
      });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED') {
        // 사용자 취소
        return;
      }
      console.log('Apple Sign-In error:', error);
    }
  };

  return {
    mutate: handleLogin,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
