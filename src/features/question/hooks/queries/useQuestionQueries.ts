import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { questionApi } from '../../api/questionApi';
import type { HistoryDirection, GetQuestionHistoryResponse } from '@/types/api';
import { fromHistoryItem, type DailyQuestionDomain } from '../../domain/questionDomain';

export const questionQueryKeys = {
  all: ['question'] as const,
  daily: (date: string) => [...questionQueryKeys.all, 'daily', date] as const,
  histories: (params: { baseDate: string; direction?: HistoryDirection }) =>
    [...questionQueryKeys.all, 'histories', params] as const,
  // 날짜별 개별 캐싱
  historyByDate: (date: string) => [...questionQueryKeys.all, 'history', date] as const,
};

export function useDailyQuestion(date: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: questionQueryKeys.daily(date),
    queryFn: () => {
      console.log('[useDailyQuestion] API 호출 날짜:', date);
      return questionApi.serveDailyQuestion(date).then((res) => res.data);
    },
    staleTime: 1000 * 60 * 5, // 5분
    enabled: options?.enabled ?? true,
  });
}

const HISTORY_FETCH_SIZE = 7;
const CALENDAR_HISTORY_FETCH_SIZE = 60; // 달력용: 약 2달치 데이터

/**
 * 히스토리 목록 조회 (달력용)
 * - DatePickerSheet에서 사용
 * - 원시 히스토리 데이터를 그대로 반환
 */
export function useQuestionHistories(
  baseDate: string,
  direction?: HistoryDirection,
  options?: { enabled?: boolean }
): UseQueryResult<GetQuestionHistoryResponse> {
  return useQuery({
    queryKey: questionQueryKeys.histories({ baseDate, direction }),
    queryFn: async () => {
      console.log('[useQuestionHistories] Fetching histories for baseDate:', baseDate, 'direction:', direction);

      const res = await questionApi.getHistories({
        baseDate,
        historyDirection: direction,
        size: CALENDAR_HISTORY_FETCH_SIZE,
      });

      console.log('[useQuestionHistories] API Response:', {
        baseDate,
        direction,
        count: res.data.histories.length,
      });

      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
    enabled: options?.enabled ?? true,
  });
}

/**
 * 특정 날짜의 질문/답변 데이터 조회
 * - 캐시에 있으면 즉시 반환
 * - 없으면 히스토리 API로 범위 조회 후 모두 캐싱
 */
export function useDailyHistory(
  date: string,
  direction?: HistoryDirection,
  options?: { enabled?: boolean }
): UseQueryResult<DailyQuestionDomain | null> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: questionQueryKeys.daily(date),
    queryFn: async () => {
      console.log('[useDailyHistory] Fetching history for date:', date, 'direction:', direction);

      const res = await questionApi.getHistories({
        baseDate: date,
        historyDirection: direction,
        size: HISTORY_FETCH_SIZE,
      });

      console.log('[useDailyHistory] API Response:', {
        date,
        direction,
        data: res.data,
      });

      // 받은 모든 날짜를 도메인 모델로 변환하여 캐시에 저장
      res.data.histories.forEach((history) => {
        queryClient.setQueryData(
          questionQueryKeys.daily(history.date),
          fromHistoryItem(history)
        );
      });

      // 요청한 날짜의 데이터를 도메인 모델로 반환
      const found = res.data.histories.find((h) => h.date === date);
      return found ? fromHistoryItem(found) : null;
    },
    staleTime: 1000 * 60 * 5, // 5분
    enabled: options?.enabled ?? true,
  });
}
