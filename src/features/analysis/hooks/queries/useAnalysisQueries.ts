import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { analysisApi } from '../../api/analysisApi';
import { isAnalysisInProgress } from '../../domain/analysisStatus';
import type { AnalysisDetailDto } from '../../types/api';

export const analysisKeys = {
  all: ['analysis'] as const,
  availability: () => [...analysisKeys.all, 'availability'] as const,
  detail: (id: number) => [...analysisKeys.all, 'detail', id] as const,
  history: () => [...analysisKeys.all, 'history'] as const,
};

/**
 * 랜딩 게이트 판정용 가용성 조회.
 *
 * **폴링하지 않는다.** 완료 반영은 ANALYSIS_DONE 푸시(useFCMLifecycle의 invalidate)와
 * 포그라운드 복귀 시 refetch(services/queryClient의 focusManager 연결)에 맡긴다.
 */
export function useAnalysisAvailability() {
  return useQuery({
    queryKey: analysisKeys.availability(),
    queryFn: () => analysisApi.getAvailability(),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

/**
 * 분석 상세/결과 조회.
 *
 * **폴링하지 않는다.** 진행 중(PENDING/PROCESSING)일 때는 staleTime을 0으로 낮춰
 * 푸시 invalidate와 포그라운드 복귀 refetch가 즉시 반영되게만 한다.
 * (완료 후에는 결과가 불변이므로 다시 캐시를 오래 유지한다.)
 */
export function useAnalysisDetail(
  id: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery<AnalysisDetailDto>({
    queryKey: analysisKeys.detail(id ?? -1),
    queryFn: () => analysisApi.getAnalysis(id as number),
    enabled: (options?.enabled ?? true) && id != null,
    staleTime: (query) =>
      query.state.data && isAnalysisInProgress(query.state.data.status)
        ? 0
        : 1000 * 60,
    refetchOnWindowFocus: true,
  });
}

/**
 * 지난 분석(리포트) 히스토리 — 커서 기반 무한 스크롤.
 * select 로 페이지를 평탄화해 컴포넌트는 가공된 배열(data)만 소비한다.
 */
export function useAnalysisHistory() {
  return useInfiniteQuery({
    queryKey: analysisKeys.history(),
    queryFn: ({ pageParam }) => analysisApi.getHistory(pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.pages.flatMap((page) => page.items),
  });
}
