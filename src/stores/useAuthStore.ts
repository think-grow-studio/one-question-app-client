import { create } from 'zustand';
import { storage } from '@/services/storage';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

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
    await storage.setAccessToken(accessToken);
    await storage.setRefreshToken(refreshToken);
    set({ isAuthenticated: true });
  },

  logout: async () => {
    await storage.clearTokens();
    set({ isAuthenticated: false });
  },
}));
