import { useQuery } from '@tanstack/react-query';
import { questionApi } from '../../api/questionApi';
import type { HistoryDirection } from '@/types/api';

export const questionQueryKeys = {
  all: ['question'] as const,
  daily: (date: string) => [...questionQueryKeys.all, 'daily', date] as const,
  histories: (params: { baseDate: string; direction?: HistoryDirection; size?: number }) =>
    [...questionQueryKeys.all, 'histories', params] as const,
};

export function useDailyQuestion(date: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: questionQueryKeys.daily(date),
    queryFn: () => questionApi.getDailyQuestion(date).then((res) => res.data),
    staleTime: 1000 * 60 * 5, // 5분
    enabled: options?.enabled ?? true,
  });
}

export function useQuestionHistories(
  baseDate: string,
  direction?: HistoryDirection,
  size?: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: questionQueryKeys.histories({ baseDate, direction, size }),
    queryFn: () =>
      questionApi
        .getHistories({ baseDate, historyDirection: direction, size })
        .then((res) => res.data),
    staleTime: 1000 * 60 * 5, // 5분
    enabled: options?.enabled ?? true,
  });
}
