import { apiClient } from '@/platform/http/apiClient';

export const questionLikeApi = {
  toggleLike: (questionId: number) =>
    apiClient.post<{ liked: boolean }>(`/api/v1/questions/${questionId}/like`),
};
