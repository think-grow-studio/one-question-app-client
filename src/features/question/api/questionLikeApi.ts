import { apiClient } from '@/services/apiClient';

export const questionLikeApi = {
  toggleLike: (questionId: number) =>
    apiClient.post<{ liked: boolean }>(`/api/v1/questions/${questionId}/like`),
};
