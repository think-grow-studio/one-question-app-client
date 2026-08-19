import type { AnalysisHistoryResponse } from '../types/api';

export function getNextAnalysisPageParam(
  page: AnalysisHistoryResponse,
): number | undefined {
  return page.hasNext ? (page.nextCursor ?? undefined) : undefined;
}
