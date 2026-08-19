import { apiClient } from '@/platform/http/apiClient';
import type { AuthResponse } from '@/shared/types/auth';
import type {
  GoogleAuthRequest,
  AppleAuthRequest,
  ReissueTokenRequest,
  AnonymousAuthRequest,
  CheckGoogleLinkRequest,
  CheckGoogleLinkResponse,
  LinkToGoogleRequest,
  CheckAppleLinkRequest,
  CheckAppleLinkResponse,
  LinkToAppleRequest,
} from '@/features/auth/types/api';

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
    apiClient.post<CheckGoogleLinkResponse>('/api/v1/auth/google/link/check', data),

  linkToGoogle: (data: LinkToGoogleRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/google/link', data),

  checkAppleLink: (data: CheckAppleLinkRequest) =>
    apiClient.post<CheckAppleLinkResponse>('/api/v1/auth/apple/link/check', data),

  linkToApple: (data: LinkToAppleRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/apple/link', data),
};
