import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { createAppleNonce } from '@/features/auth/utils/appleNonce';

/**
 * Apple Sign-In native sheet에서 사용자가 [취소]를 눌렀음을 나타내는 sentinel.
 * mutation onError에서 instanceof로 식별해 일반 에러와 다르게 silent 처리한다.
 */
export class AppleSignInCancelledError extends Error {
  constructor() {
    super('Apple Sign-In cancelled by user');
    this.name = 'AppleSignInCancelledError';
  }
}

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
    // 사용자 액션 기반 흐름 — retry 시 native sheet가 다시 뜨므로 UX 망가짐.
    // 또한 cancel sentinel은 status가 없어 전역 default retry 정책에 retryable로 잡힘.
    retry: false,
    mutationFn: async () => {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only available on iOS');
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      const { rawNonce, hashedNonce } = await createAppleNonce();

      let credential: AppleAuthentication.AppleAuthenticationCredential;
      try {
        credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });
      } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (code === 'ERR_REQUEST_CANCELED') {
          throw new AppleSignInCancelledError();
        }
        throw error;
      }

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
    // 멱등 보장 어려운 link 호출 — 자동 retry로 중복 시도되지 않도록 차단.
    retry: false,
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
      // member 캐시 invalidate는 호출자(LinkAppleButton)가 success dialog 닫힘 시점에 트리거.
      // 이유: 즉시 invalidate하면 useMemberMe refetch → provider ANONYMOUS→APPLE 변경 →
      // settings.tsx의 isAnonymousProvider 분기로 LinkAppleButton 자체가 unmount →
      // 자식 AlertDialog 함께 unmount되어 사용자가 안내를 보지 못함.
    },
  });
}
