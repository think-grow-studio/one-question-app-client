import type { QueryClient } from '@tanstack/react-query';
import { analysisKeys } from '../hooks/queries/useAnalysisQueries';

/** ANALYSIS_DONE 등 외부 이벤트로 분석 쿼리를 무효화할 때 쓰는 cache helper. */
export function invalidateAnalysisQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: analysisKeys.all });
}
