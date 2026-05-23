import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { publicQuestionApi } from '../../api/publicQuestionApi';
import {
  fromPublicAnswerDto,
  type PublicAnswerCursor,
} from '../../types/api';

export const publicQuestionQueryKeys = {
  all: ['publicQuestion'] as const,
  daily: (date: string) => [...publicQuestionQueryKeys.all, 'daily', date] as const,
  answers: (pdqId: number) => [...publicQuestionQueryKeys.all, pdqId, 'answers'] as const,
};

// 캐시 미사용 정책 — 추후 캐시 도입 시 이 객체만 수정하면 모든 PDQ 쿼리에 적용됨.
const NO_CACHE = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always' as const,
};

export function useDailyPublicQuestion(date: string) {
  return useQuery({
    queryKey: publicQuestionQueryKeys.daily(date),
    queryFn: () => publicQuestionApi.getDaily(date).then((r) => r.data),
    ...NO_CACHE,
  });
}

export function useInfinitePublicAnswers(pdqId: number | undefined) {
  return useInfiniteQuery({
    queryKey: publicQuestionQueryKeys.answers(pdqId ?? -1),
    queryFn: async ({ pageParam }) => {
      const res = await publicQuestionApi.listAnswers(pdqId as number, {
        cursorAnsweredAt: pageParam?.answeredAt,
        cursorId: pageParam?.id,
        size: 20,
      });
      return {
        ...res.data,
        items: res.data.items.map(fromPublicAnswerDto),
      };
    },
    initialPageParam: undefined as PublicAnswerCursor | undefined,
    getNextPageParam: (last) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined,
    enabled: pdqId !== undefined,
    ...NO_CACHE,
  });
}
