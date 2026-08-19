import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { GoogleAuthRequest } from '@/features/auth/types/api';
import { logEvent, AnalyticsEvents } from '@/platform/firebase';

// Google Sign-In 설정
let isGoogleSignInConfigured = false;

const configureGoogleSignIn = () => {
  const expoConfig = Constants.expoConfig;
  const extra = expoConfig?.extra || {};

  // Web Client ID는 idToken을 받기 위해 필요 (백엔드 검증용)
  const webClientId =
    extra.googleClientIdWeb || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;

  if (!webClientId) {
    console.warn('[GoogleSignIn] webClientId is missing, skipping configure');
    return;
  }

  GoogleSignin.configure({
    webClientId,
    offlineAccess: true, // refresh token 획득
    scopes: ['email', 'profile'],
  });
  isGoogleSignInConfigured = true;
};

export function useGoogleLogin() {
  const { login } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // 컴포넌트 마운트 시 Google Sign-In 설정
  useEffect(() => {
    configureGoogleSignIn();
    setIsReady(true);
  }, []);

  const mutation = useMutation({
    mutationFn: async (params: GoogleAuthRequest) => {
      const { data } = await authApi.googleLogin(params);
      return data;
    },
    onSuccess: async (data) => {
      logEvent(AnalyticsEvents.LOGIN, { method: 'google' });
      await login(data.accessToken, data.refreshToken);
    },
    onError: () => {
      logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'google', reason: 'server_error' });
    },
  });

  const handleLogin = async () => {
    if (!isGoogleSignInConfigured) {
      console.warn('[GoogleSignIn] Not configured, cannot sign in');
      return;
    }

    logEvent(AnalyticsEvents.LOGIN_START, { method: 'google' });

    try {
      // Google Play Services 확인 (Android)
      await GoogleSignin.hasPlayServices();

      // 기존 세션 클리어 (항상 계정 선택 화면 표시)
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // 로그인된 적 없으면 에러 발생 가능, 무시
      }

      // Google Sign-In 실행
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken, user } = response.data;

        if (idToken) {
          mutation.mutate({
            idToken,
            email: user.email,
            name: user.name ?? undefined,
          });
        }
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // 이미 로그인 진행 중 — 중복 탭이라 실패로 집계하지 않음
            console.log('Sign in is in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log('Play services not available');
            logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'google', reason: 'play_services_unavailable' });
            break;
          case statusCodes.SIGN_IN_CANCELLED:
            // 사용자가 취소 — 실제 이탈 지점이라 퍼널 분석을 위해 기록
            console.log('Sign in cancelled');
            logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'google', reason: 'cancelled' });
            break;
          default:
            console.log('Google Sign-In error:', error.code, error.message);
            logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'google', reason: 'google_signin_error' });
        }
      } else {
        console.log('Unknown error during Google Sign-In:', error);
        logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'google', reason: 'unknown_error' });
      }
    }
  };

  return {
    mutate: handleLogin,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isReady,
  };
}
