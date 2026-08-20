import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { QueryClient, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { questionApi } from '../../api/questionApi';
import type { HistoryDirection } from '../../types/api';
import {
  fromHistoryItem,
  fromServeDailyQuestion,
  type DailyQuestionDomain,
} from '../../model/questionDomain';
import { formatLocalDate } from '@/shared/utils/date';

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
  timeline: ['question', 'timeline'] as const,
};

/**
 * 'YYYY-MM-DD' 문자열의 하루 전 날짜 문자열 반환 (로컬 기준, TZ 이슈 회피)
 * @example prevDayString('2025-05-15') // '2025-05-14'
 */
function prevDayString(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return formatLocalDate(new Date(year, month - 1, day - 1));
}

export function useDailyQuestion(date: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: questionQueryKeys.daily(date),
    queryFn: () => questionApi.serveDailyQuestion(date).then((res) => fromServeDailyQuestion(date, res.data)),
    staleTime: 1000 * 60 * 5, // 5분
    enabled: options?.enabled ?? true,
  });
}

const HISTORY_FETCH_SIZE = 7;

type CalendarHistoryOptions = {
  enabled?: boolean;
  baseDateOverride?: string;
};

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
      const res = await questionApi.getHistories({
        baseDate: date,
        historyDirection: direction,
        size: HISTORY_FETCH_SIZE,
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

const TIMELINE_PAGE_SIZE = 15;

/**
 * 홈 타임라인 뷰 전용 무한 스크롤 조회 훅
 *
 * 설계 (카드 뷰와 동일하게 "상태는 query cache에" — 컴포넌트/스토어 수동 상태 없음):
 * - `useInfiniteQuery(timeline 키)` — 누적 페이지·커서가 캐시에 살아서 뷰 토글로
 *   unmount돼도 유지됨. staleTime 내 재진입 시 refetch 없이 즉시 표시.
 * - 페이지 fetch: 타임라인 전용 API(GET /questions/timelines)로 "기록 있는 날만"
 *   최신순 {@link TIMELINE_PAGE_SIZE}개 조회 (질문 없는 날은 서버가 건너뜀 — NO_QUESTION 미포함)
 * - 커서: baseDate 포함(inclusive) 과거 방향 → 다음 페이지 = 응답 startDate(가장 과거 기록일) - 1일
 * - 받은 날짜 전부 daily(date)에 시딩 → 타임라인 카드 탭 시 카드 뷰 즉시 표시
 * - 동기화: 질문/답변 mutation들이 timeline 키를 invalidate → 수정 후 재진입 시 1회 refetch로 최신화
 *   (`useQuestionMutations.ts` 참고)
 */
/**
 * useTimeline / usePrefetchTimeline이 공유하는 쿼리 옵션.
 * initialPageParam은 호출 시점에 평가 — useMemo로 박제하면 자정 넘긴 뒤
 * 어제로 고정됨 (CommonQuestionFeed의 todayStr lazy 평가 컨벤션과 동일)
 */
function timelineQueryOptions(queryClient: QueryClient) {
  return infiniteQueryOptions({
    queryKey: questionQueryKeys.timeline,
    queryFn: async ({ pageParam }) => {
      const res = await questionApi.getTimeline({
        baseDate: pageParam,
        size: TIMELINE_PAGE_SIZE,
      });

      // 카드 탭 즉시 표시용 daily 캐시 시딩 (useDailyHistory와 동일 패턴)
      res.data.histories.forEach((history) => {
        queryClient.setQueryData(
          questionQueryKeys.daily(history.date),
          fromHistoryItem(history)
        );
      });

      return res.data;
    },
    initialPageParam: formatLocalDate(),
    // 서버 조회가 baseDate 포함(inclusive)이므로 다음 커서는 가장 과거 기록일 - 1일.
    // 빈 결과면 startDate가 null (OpenAPI 명세) → 종료.
    getNextPageParam: (lastPage) =>
      lastPage.hasPrevious && lastPage.startDate
        ? prevDayString(lastPage.startDate)
        : undefined,
    staleTime: 1000 * 60 * 30, // 30분 (useDailyHistory와 통일)
  });
}

/**
 * 홈 진입 시 타임라인 1페이지 백그라운드 선로딩 — 최초 토글도 스피너 없이 즉시 표시.
 * - staleTime 내 캐시가 있으면 no-op (세션당 사실상 1회)
 * - 첫 페인트(오늘 질문 조회)와 대역폭 경쟁하지 않도록 인터랙션 완료 후 실행
 * - 백그라운드 실패는 글로벌 에러 dialog 생략 (meta.suppressGlobalError)
 */
export function usePrefetchTimeline() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 오늘 질문 조회(첫 페인트)에 대역폭 양보 후 발사.
    // InteractionManager는 RN 0.83에서 deprecated → 고정 지연으로 대체.
    const timer = setTimeout(() => {
      void queryClient.prefetchInfiniteQuery({
        ...timelineQueryOptions(queryClient),
        meta: { suppressGlobalError: true },
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [queryClient]);
}

export function useTimeline() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    ...timelineQueryOptions(queryClient),
    // 데이터 변환은 데이터 계층에서 (§5.4): 페이지 → flat → 도메인 모델
    // → date 기준 경계 중복 방어 → 최신순 정렬. 컴포넌트는 가공된 배열만 소비.
    // getNextPageParam은 raw 페이지에 동작하므로 select 영향 없음.
    select: (data) => {
      const seen = new Set<string>();
      const items: DailyQuestionDomain[] = [];
      for (const page of data.pages) {
        for (const history of page.histories) {
          if (seen.has(history.date)) continue;
          seen.add(history.date);
          items.push(fromHistoryItem(history));
        }
      }
      items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      return items;
    },
  });

  // pull-to-refresh — 누적 페이지 캐시를 비우고 첫 페이지부터 재조회 (피드 패턴 §15.2)
  const resetPagination = useCallback(() => {
    void queryClient.resetQueries({ queryKey: questionQueryKeys.timeline });
  }, [queryClient]);

  return Object.assign(query, { resetPagination });
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
  options?: CalendarHistoryOptions
): UseQueryResult<DailyQuestionDomain[]> {
  const queryClient = useQueryClient();

  // 현재 보고 있는 월의 15일 계산
  const cacheBaseDate = useMemo(() => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-15`;
  }, [viewYear, viewMonth]);

  const fetchBaseDate = options?.baseDateOverride ?? cacheBaseDate;

  return useQuery({
    queryKey: questionQueryKeys.calendar(cacheBaseDate),

    queryFn: async () => {
      const res = await questionApi.getHistories({
        baseDate: fetchBaseDate,
        historyDirection: 'BOTH',
        size: 35,
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
