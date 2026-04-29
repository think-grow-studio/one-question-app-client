import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { queryClient } from '@/services/queryClient';
import { memberQueryKeys } from '@/features/member/hooks/queries/useMemberQueries';
import { createAppleNonce } from '@/features/auth/utils/appleNonce';

interface CheckAppleLinkResult {
  checkResult: { exists: boolean };
  identityToken: string;
  name?: string;
  authorizationCode?: string;
  rawNonce: string;
}

// Apple 로그인 → 중복 확인
export function useCheckAppleLinkMutation() {
  return useMutation<CheckAppleLinkResult, Error, void>({
    mutationFn: async () => {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only available on iOS');
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
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
        throw new Error('No identityToken received from Apple');
      }

      const name =
        [credential.fullName?.familyName, credential.fullName?.givenName]
          .filter(Boolean)
          .join(' ')
          .trim() || undefined;

      const { data: checkResult } = await authApi.checkAppleLink({
        identityToken: credential.identityToken,
        rawNonce,
      });

      return {
        checkResult,
        identityToken: credential.identityToken,
        name,
        authorizationCode: credential.authorizationCode ?? undefined,
        rawNonce,
      };
    },
  });
}

// 익명 → Apple 계정 연동
export function useLinkToAppleMutation() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (params: {
      identityToken: string;
      name?: string;
      authorizationCode?: string;
      rawNonce: string;
    }) => {
      const { data } = await authApi.linkToApple(params);
      return data;
    },
    onSuccess: async (data) => {
      await login(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.me() });
    },
  });
}
