import { apiClient } from '@/services/apiClient';
import type {
  GoogleAuthRequest,
  AppleAuthRequest,
  AuthResponse,
  ReissueTokenRequest,
} from '@/types/api';

export const authApi = {
  googleLogin: (data: GoogleAuthRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/google', data),

  appleLogin: (data: AppleAuthRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/apple', data),

  logout: () => apiClient.post<void>('/api/v1/auth/logout'),

  reissueToken: (data: ReissueTokenRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/reissue-token', data),

  withdraw: () => apiClient.delete<void>('/api/v1/auth/me'),
};
