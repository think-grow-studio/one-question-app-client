import { apiClient } from '@/platform/http/apiClient';
import type { GetMemberResponse, UpdateMemberRequest } from '@/features/member/types/api';

export const memberApi = {
  getMe: () => apiClient.get<GetMemberResponse>('/api/v1/members/me'),

  updateMe: (data: UpdateMemberRequest) =>
    apiClient.patch<void>('/api/v1/members/me', data),
};
