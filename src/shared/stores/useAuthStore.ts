import { create } from 'zustand';
import { storage } from '@/services/storage';
import { queryClient } from '@/services/queryClient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { setCrashlyticsUserId, setUserId, signOutFirebase, isFirebaseAnonymousUser } from '@/services/firebase';

/**
 * 세션 종료 시 실행할 feature 측 정리 작업 (의존 역전).
 * shared 스토어가 feature 모듈을 임포트하지 않도록, feature가
 * 앱 부트스트랩(_layout) 시점에 자신의 정리 작업을 등록한다.
 */
export interface AuthCleanupTasks {
  /** logout() 전용 — 액세스 토큰 만료 전 서버 정리 (회원 탈퇴 경로에선 실행 안 됨) */
  beforeServerLogout?: () => Promise<void>;
  /** 모든 세션 종료 경로(로그아웃·탈퇴) 공통 로컬 상태 정리 */
  onLocalCleanup?: () => void;
}

const authCleanupTasks: AuthCleanupTasks[] = [];

export function registerAuthCleanup(tasks: AuthCleanupTasks): void {
  authCleanupTasks.push(tasks);
}

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
   * - 일반 로그아웃: logout()이 beforeServerLogout(FCM 토큰 삭제 등) 후에 호출
   * - 회원 탈퇴: useWithdrawMutation이 직접 호출 (탈퇴 API가 서버에서 fcm_token을
   *   함께 정리하므로 클라이언트가 서버 삭제를 또 호출할 이유가 없음)
   */
  cleanupLocalAuth: async () => {
    for (const tasks of authCleanupTasks) {
      tasks.onLocalCleanup?.();
    }
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
      // feature 측 서버 정리 (best effort, 액세스 토큰 만료 전에 호출)
      for (const tasks of authCleanupTasks) {
        if (tasks.beforeServerLogout) {
          try { await tasks.beforeServerLogout(); } catch {}
        }
      }

      await get().cleanupLocalAuth();
    } finally {
      isLoggingOut = false;
    }
  },
}));
