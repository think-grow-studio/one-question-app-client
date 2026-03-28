import type {
  GetFeedListResponse,
  GetFeedDetailResponse,
  ToggleLikeResponse,
  TogglePublicResponse,
} from '@/shared/types/api';
// import { apiClient } from '@/services/apiClient';
import { MOCK_FEED_ITEMS } from './__mocks__/feedMockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const feedApi = {
  /** 피드 목록 조회 (커서 기반 페이지네이션) */
  getFeedList: async (params: {
    cursor?: number;
    size?: number;
  }): Promise<{ data: GetFeedListResponse }> => {
    await delay(500);
    const size = params.size ?? 10;
    const startIndex = params.cursor
      ? MOCK_FEED_ITEMS.findIndex((item) => item.feedId === params.cursor) + 1
      : 0;
    const items = MOCK_FEED_ITEMS.slice(startIndex, startIndex + size);
    const nextItem = MOCK_FEED_ITEMS[startIndex + size];
    return {
      data: {
        items,
        nextCursor: nextItem?.feedId ?? null,
        hasMore: !!nextItem,
      },
    };
    // Real: return apiClient.get<GetFeedListResponse>('/api/v1/feed', { params });
  },

  /** 피드 상세 조회 */
  getFeedDetail: async (
    feedId: number
  ): Promise<{ data: GetFeedDetailResponse }> => {
    await delay(300);
    const item = MOCK_FEED_ITEMS.find((i) => i.feedId === feedId);
    if (!item) throw new Error('Feed not found');
    return { data: { ...item } };
    // Real: return apiClient.get<GetFeedDetailResponse>(`/api/v1/feed/${feedId}`);
  },

  /** 좋아요 토글 */
  toggleLike: async (
    feedId: number
  ): Promise<{ data: ToggleLikeResponse }> => {
    await delay(200);
    const item = MOCK_FEED_ITEMS.find((i) => i.feedId === feedId);
    if (!item) throw new Error('Feed not found');
    item.isLiked = !item.isLiked;
    item.likeCount += item.isLiked ? 1 : -1;
    return {
      data: { feedId, isLiked: item.isLiked, likeCount: item.likeCount },
    };
    // Real: return apiClient.post<ToggleLikeResponse>(`/api/v1/feed/${feedId}/like`);
  },

  /** 답변 공개/비공개 토글 */
  togglePublic: async (
    dailyAnswerId: number
  ): Promise<{ data: TogglePublicResponse }> => {
    await delay(300);
    return { data: { dailyAnswerId, isPublic: true } };
    // Real: return apiClient.patch<TogglePublicResponse>(`/api/v1/answers/${dailyAnswerId}/public`);
  },
};
