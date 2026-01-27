import { storage } from './storage';

export const authService = {
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getAccessToken();
    return !!token;
  },

  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await storage.setAccessToken(accessToken);
    if (refreshToken) {
      await storage.setRefreshToken(refreshToken);
    }
  },

  async logout(): Promise<void> {
    await storage.clearTokens();
  },

  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) return null;

      // TODO: 실제 refresh endpoint 연결
      // const response = await apiClient.post('/auth/refresh', { refreshToken });
      // const newAccessToken = response.data.accessToken;
      // await storage.setAccessToken(newAccessToken);
      // return newAccessToken;

      return null;
    } catch {
      await storage.clearTokens();
      return null;
    }
  },
};
