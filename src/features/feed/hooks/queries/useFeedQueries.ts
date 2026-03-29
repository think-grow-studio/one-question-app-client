import { useInfiniteQuery } from '@tanstack/react-query';
import { feedApi } from '../../api/feedApi';
import { fromAnswerPostFeedItemDto } from '../../types/api';

export const feedQueryKeys = {
  all: ['feed'] as const,
  list: () => [...feedQueryKeys.all, 'list'] as const,
};

export function useFeedList() {
  return useInfiniteQuery({
    queryKey: feedQueryKeys.list(),
    queryFn: async ({ pageParam }) => {
      const res = await feedApi.getFeedList({
        cursor: pageParam,
        size: 20,
      });
      return {
        ...res.data,
        items: res.data.items.map(fromAnswerPostFeedItemDto),
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
    staleTime: 1000 * 60 * 5,
  });
}
