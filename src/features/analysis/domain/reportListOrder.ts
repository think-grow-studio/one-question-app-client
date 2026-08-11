import { isAnalysisInProgress } from './analysisStatus';
import type { AnalysisHistoryItemDto } from '../types/api';

export function orderAnalysisReports(
  items: readonly AnalysisHistoryItemDto[],
): AnalysisHistoryItemDto[] {
  return [...items].sort((left, right) => {
    const progressDelta =
      Number(isAnalysisInProgress(right.status)) - Number(isAnalysisInProgress(left.status));
    if (progressDelta !== 0) return progressDelta;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}
