import { apiClient } from '@/services/apiClient';
import type {
  GoogleAuthRequest,
  AppleAuthRequest,
  AuthResponse,
  ReissueTokenRequest,
  AnonymousAuthRequest,
  CheckGoogleLinkRequest,
  CheckGoogleLinkResponse,
  LinkToGoogleRequest,
} from '@/shared/types/api';

export const authApi = {
  googleLogin: (data: GoogleAuthRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/google', data),

  appleLogin: (data: AppleAuthRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/apple', data),

  anonymousLogin: (data: AnonymousAuthRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/anonymous', data),

  logout: () => apiClient.post<void>('/api/v1/auth/logout'),

  reissueToken: (data: ReissueTokenRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/reissue-token', data),

  withdraw: () => apiClient.delete<void>('/api/v1/auth/me'),

  checkGoogleLink: (data: CheckGoogleLinkRequest) =>
    apiClient.post<CheckGoogleLinkResponse>('/api/v1/auth/check-google-link', data),

  linkToGoogle: (data: LinkToGoogleRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/link-to-google', data),
};
