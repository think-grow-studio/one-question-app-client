import { apiClient } from '@/services/apiClient';
import type { GetMemberResponse, UpdateMemberRequest } from '@/types/api';

export const memberApi = {
  getMe: () => apiClient.get<GetMemberResponse>('/api/v1/members/me'),

  updateMe: (data: UpdateMemberRequest) =>
    apiClient.patch<void>('/api/v1/members/me', data),
};
