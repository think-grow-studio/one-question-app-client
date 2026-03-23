import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { feedApi } from '../../api/feedApi';
import { fromFeedItemDto } from '../../domain/feedDomain';

export const feedQueryKeys = {
  all: ['feed'] as const,
  list: () => [...feedQueryKeys.all, 'list'] as const,
  detail: (feedId: number) => [...feedQueryKeys.all, 'detail', feedId] as const,
};

export function useFeedList() {
  return useInfiniteQuery({
    queryKey: feedQueryKeys.list(),
    queryFn: async ({ pageParam }) => {
      const res = await feedApi.getFeedList({
        cursor: pageParam,
        size: 10,
      });
      return {
        ...res.data,
        items: res.data.items.map(fromFeedItemDto),
      };
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeedDetail(feedId: number) {
  return useQuery({
    queryKey: feedQueryKeys.detail(feedId),
    queryFn: async () => {
      const res = await feedApi.getFeedDetail(feedId);
      return fromFeedItemDto(res.data);
    },
    staleTime: 1000 * 60 * 5,
    enabled: feedId > 0,
  });
}
