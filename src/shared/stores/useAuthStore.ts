import { create } from 'zustand';
import { storage } from '@/services/storage';
import { queryClient } from '@/services/queryClient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { setCrashlyticsUserId, setUserId, signOutFirebase, isFirebaseAnonymousUser } from '@/services/firebase';
import { notificationApi } from '@/features/settings/api/notificationApi';
import { useNotificationStore } from '@/features/settings/stores/useNotificationStore';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  cleanupLocalAuth: () => Promise<void>;
}

// Logout guard to prevent multiple simultaneous logout calls
let isLoggingOut = false;

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await storage.getAccessToken();
      set({ isAuthenticated: !!token, isLoading: false });
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  login: async (accessToken: string, refreshToken: string) => {
    await storage.setTokens(accessToken, refreshToken);
    setCrashlyticsUserId('authenticated');
    set({ isAuthenticated: true });
  },

  /**
   * 로컬 인증/세션 클린업 (네트워크 호출 없음).
   * - 일반 로그아웃: logout()이 deleteFcmToken 후에 호출
   * - 회원 탈퇴: useWithdrawMutation이 직접 호출 (서버가 fcm_token row를 이미
   *   cascade로 정리하므로 deleteFcmToken을 호출하면 "회원을 찾을 수 없다" 에러 발생)
   */
  cleanupLocalAuth: async () => {
    useNotificationStore.getState().setFcmToken(null);
    await storage.clearTokens();
    queryClient.clear(); // 모든 캐시 데이터 삭제

    // 구글 계정 연결 해제 (다음 로그인 시 계정 선택 화면 표시)
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.warn('Google sign out failed:', error);
    }

    // Firebase 로그아웃 (익명 사용자는 세션 유지 — 재로그인 시 같은 계정 복귀)
    if (!isFirebaseAnonymousUser()) {
      try {
        await signOutFirebase();
      } catch (error) {
        console.warn('Firebase sign out failed:', error);
      }
    }

    setCrashlyticsUserId(null);
    setUserId(null);
    set({ isAuthenticated: false });
  },

  logout: async () => {
    // 이미 로그아웃 중이면 무시 (중복 호출 방지)
    if (isLoggingOut) return;

    isLoggingOut = true;
    try {
      // FCM 토큰 삭제 (best effort, 액세스 토큰 만료 전에 호출)
      const { fcmToken } = useNotificationStore.getState();
      if (fcmToken) {
        try { await notificationApi.deleteFcmToken(fcmToken); } catch {}
      }

      await get().cleanupLocalAuth();
    } finally {
      isLoggingOut = false;
    }
  },
}));
