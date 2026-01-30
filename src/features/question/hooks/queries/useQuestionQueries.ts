import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { questionApi } from '../../api/questionApi';
import type { HistoryDirection } from '@/types/api';
import { fromHistoryItem, type DailyQuestionDomain } from '../../domain/questionDomain';

/**
 * 날짜를 달력 캐시 키의 baseDate로 변환
 * @param date 'YYYY-MM-DD' 형식의 날짜
 * @returns 'YYYY-MM-15' 형식의 baseDate (해당 월의 15일)
 * @example getCalendarBaseDate('2025-01-20') // '2025-01-15'
 */
export function getCalendarBaseDate(date: string): string {
  const [year, month] = date.split('-');
  return `${year}-${month}-15`;
}

export const questionQueryKeys = {
  all: ['question'] as const,
  daily: (date: string) => [...questionQueryKeys.all, 'daily', date] as const,
  calendar: (baseDate: string) => ['calendar', 'month', baseDate] as const,
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
    staleTime: 1000 * 60 * 30, // 30분
    enabled: options?.enabled ?? true,
  });
}

/**
 * 달력(DatePickerSheet) 전용 히스토리 조회 훅
 *
 * 특징:
 * - 현재 월의 15일 기준 35일 범위 조회
 * - 배열 반환 (DailyQuestionDomain[])
 * - 각 날짜를 daily(date) 캐시에 저장 (부작용)
 * - refetchOnMount: 'always'로 달력 열 때마다 최신 데이터 보장
 *
 * 캐시 키 설계:
 * - queryKey: ['calendar', 'month', baseDate] (별도 키!)
 * - daily(baseDate) 사용 시 타입 충돌 (배열 vs 단일 객체)
 * - queryFn의 return 값이 최종 캐시 값이므로 분리 필수
 */
export function useCalendarHistory(
  viewYear: number,
  viewMonth: number,
  options?: { enabled?: boolean }
): UseQueryResult<DailyQuestionDomain[]> {
  const queryClient = useQueryClient();

  // 현재 보고 있는 월의 15일 계산
  const baseDate = useMemo(() => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-15`;
  }, [viewYear, viewMonth]);

  return useQuery({
    queryKey: questionQueryKeys.calendar(baseDate),

    queryFn: async () => {
      console.log('[useCalendarHistory] Fetching calendar data for month:', baseDate);

      const res = await questionApi.getHistories({
        baseDate,
        historyDirection: 'BOTH',
        size: 35,
      });

      console.log('[useCalendarHistory] API Response:', {
        baseDate,
        count: res.data.histories.length,
      });

      // 각 날짜를 daily 캐시에 저장 (부작용)
      res.data.histories.forEach((history) => {
        queryClient.setQueryData(
          questionQueryKeys.daily(history.date),
          fromHistoryItem(history)
        );
      });

      // 도메인 객체 배열 반환
      return res.data.histories.map(history => fromHistoryItem(history));
    },

    staleTime: 1000 * 60 * 30,  // 30분 (useDailyHistory와 통일)
    refetchOnMount: 'always',   // 달력 열 때마다 항상 새로 조회
    enabled: options?.enabled ?? true,
  });
}
