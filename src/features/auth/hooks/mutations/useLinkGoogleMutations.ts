import { useMutation } from '@tanstack/react-query';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { queryClient } from '@/services/queryClient';
import { memberQueryKeys } from '@/features/member/hooks/queries/useMemberQueries';

/**
 * Google Sign-In native sheet에서 사용자가 [취소]를 눌렀음을 나타내는 sentinel.
 * mutation onError에서 instanceof로 식별해 일반 에러와 다르게 silent 처리한다.
 */
export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google Sign-In cancelled by user');
    this.name = 'GoogleSignInCancelledError';
  }
}

// Google Sign-In 설정 (anonymous 로그인만 한 경우 미설정 상태일 수 있음)
let isConfigured = false;

function ensureGoogleSignInConfigured() {
  if (isConfigured) return;

  const extra = Constants.expoConfig?.extra || {};
  const webClientId =
    extra.googleClientIdWeb || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;

  if (!webClientId) {
    console.warn('[LinkGoogle] webClientId is missing, skipping configure');
    return;
  }

  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
    scopes: ['email', 'profile'],
  });
  isConfigured = true;
}

// Google 로그인 → 중복 확인
export function useCheckGoogleLinkMutation() {
  return useMutation({
    // 사용자 액션 기반 흐름 — retry 시 native sheet가 다시 뜨므로 UX 망가짐.
    // 또한 cancel sentinel은 status가 없어 전역 default retry 정책에 retryable로 잡힘.
    retry: false,
    mutationFn: async () => {
      ensureGoogleSignInConfigured();

      await GoogleSignin.hasPlayServices();

      // 기존 세션 클리어 (항상 계정 선택 화면 표시)
      try {
        await GoogleSignin.signOut();
      } catch {
        // 로그인된 적 없으면 에러 발생 가능, 무시
      }

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        // v13+ 모듈식 API는 cancel 시 throw 대신 { type: 'cancelled' } 반환
        if (response.type === 'cancelled') {
          throw new GoogleSignInCancelledError();
        }
        throw new Error('Google Sign-In failed');
      }

      const { idToken, user } = response.data;
      if (!idToken) {
        throw new Error('No idToken received from Google');
      }

      const { data: checkResult } = await authApi.checkGoogleLink({ idToken });

      return {
        checkResult,
        idToken,
        email: user.email,
        name: user.name ?? undefined,
      };
    },
  });
}

// 익명 → Google 계정 연동
export function useLinkToGoogleMutation() {
  const { login } = useAuthStore();

  return useMutation({
    // 멱등 보장 어려운 link 호출 — 자동 retry로 중복 시도되지 않도록 차단.
    retry: false,
    mutationFn: async (params: { idToken: string; email?: string; name?: string }) => {
      const { data } = await authApi.linkToGoogle(params);
      return data;
    },
    onSuccess: async (data) => {
      await login(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.me() });
    },
  });
}
