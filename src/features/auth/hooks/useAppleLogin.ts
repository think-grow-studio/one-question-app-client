import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { AppleAuthRequest } from '@/shared/types/api';
import { createAppleNonce } from '@/features/auth/utils/appleNonce';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

export function useAppleLogin() {
  const { login } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async (params: AppleAuthRequest) => {
      const { data } = await authApi.appleLogin(params);
      return data;
    },
    onSuccess: async (data) => {
      logEvent(AnalyticsEvents.LOGIN, { method: 'apple' });
      await login(data.accessToken, data.refreshToken);
    },
    onError: () => {
      logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'apple', reason: 'server_error' });
    },
  });

  const handleLogin = async () => {
    if (Platform.OS !== 'ios') {
      console.warn('[AppleSignIn] iOS only');
      return;
    }

    logEvent(AnalyticsEvents.LOGIN_START, { method: 'apple' });

    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        console.warn('[AppleSignIn] Not available on this device (requires iOS 13+)');
        logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'apple', reason: 'not_available' });
        return;
      }

      const { rawNonce, hashedNonce } = await createAppleNonce();

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        console.warn('[AppleSignIn] No identityToken in credential');
        logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'apple', reason: 'no_identity_token' });
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
        authorizationCode: credential.authorizationCode ?? undefined,
        rawNonce,
      });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED') {
        // 사용자 취소 — 실제 이탈 지점이라 퍼널 분석을 위해 기록
        logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'apple', reason: 'cancelled' });
        return;
      }
      console.log('Apple Sign-In error:', error);
      logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'apple', reason: 'apple_signin_error' });
    }
  };

  return {
    mutate: handleLogin,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
