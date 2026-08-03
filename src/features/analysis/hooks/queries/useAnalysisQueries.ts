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

/** 진행 중 분석 폴링 주기 (FCM 누락 대비 fallback) */
const PROCESSING_POLL_MS = 3000;

/**
 * 랜딩 게이트 판정용 가용성 조회.
 * 진행 중(PROCESSING)이면 주기적으로 재조회해 완료 시 IDLE 로 자동 전환.
 */
export function useAnalysisAvailability() {
  return useQuery({
    queryKey: analysisKeys.availability(),
    queryFn: () => analysisApi.getAvailability(),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.reason === 'PROCESSING' ? PROCESSING_POLL_MS : false,
  });
}

/**
 * 분석 상세/결과 조회.
 * PROCESSING 동안 폴링 → READY/FAILED 로 전환되면 폴링 중단.
 */
export function useAnalysisDetail(
  id: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery<AnalysisDetailDto>({
    queryKey: analysisKeys.detail(id ?? -1),
    queryFn: () => analysisApi.getAnalysis(id as number),
    enabled: (options?.enabled ?? true) && id != null,
    staleTime: 1000 * 60,
    // PENDING(접수 직후)에서도 폴링해야 한다 — PROCESSING만 보면 서버가 아직 작업을
    // 집어들기 전 구간에서 폴링이 멈춰 결과 화면이 영영 갱신되지 않는다.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isAnalysisInProgress(status) ? PROCESSING_POLL_MS : false;
    },
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
