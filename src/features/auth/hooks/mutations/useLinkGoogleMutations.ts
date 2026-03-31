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
