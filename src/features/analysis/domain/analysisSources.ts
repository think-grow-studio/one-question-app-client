import type { AnalysisReportSourceDto } from '../types/api';

export function sortAnalysisSourcesNewestFirst(
  sources: readonly AnalysisReportSourceDto[],
): AnalysisReportSourceDto[] {
  return [...sources].sort((a, b) =>
    b.questionDate.localeCompare(a.questionDate),
  );
}
