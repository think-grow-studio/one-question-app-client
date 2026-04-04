import { apiClient } from '@/services/apiClient';
import type { ToggleLikeResponse } from '@/shared/types/api';

export const questionLikeApi = {
  toggleLike: (questionId: number) =>
    apiClient.post<ToggleLikeResponse>(`/api/v1/questions/${questionId}/like`),
};
