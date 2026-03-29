import { apiClient } from '@/services/apiClient';
import type {
  AnswerPostFeedResponse,
  ToggleLikeResponse,
} from '@/shared/types/api';

export const feedApi = {
  /** 피드 목록 조회 (커서 기반 페이지네이션) */
  getFeedList: (params: { cursor?: string; size?: number }) =>
    apiClient.get<AnswerPostFeedResponse>('/api/v1/answer-posts', { params }),

  /** 좋아요 토글 */
  toggleLike: (answerPostId: number) =>
    apiClient.post<ToggleLikeResponse>(
      `/api/v1/answer-posts/${answerPostId}/like`
    ),
};
