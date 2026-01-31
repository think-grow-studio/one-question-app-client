import { create } from 'zustand';
import { storage } from '@/services/storage';
import { queryClient } from '@/services/queryClient';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Logout guard to prevent multiple simultaneous logout calls
let isLoggingOut = false;

export const useAuthStore = create<AuthState>()((set) => ({
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
    set({ isAuthenticated: true });
  },

  logout: async () => {
    // 이미 로그아웃 중이면 무시 (중복 호출 방지)
    if (isLoggingOut) return;

    isLoggingOut = true;
    try {
      await storage.clearTokens();
      queryClient.clear(); // 모든 캐시 데이터 삭제
      set({ isAuthenticated: false });
    } finally {
      isLoggingOut = false;
    }
  },
}));
