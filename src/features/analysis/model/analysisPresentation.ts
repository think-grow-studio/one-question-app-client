import type { AnalysisDetailDto, AnalysisStatus } from '../types/api';

export type AnalysisStatusLabelKey =
  | 'list.processing'
  | 'list.completed'
  | 'list.failed';

export function getAnalysisStatusLabelKey(
  status: AnalysisStatus,
): AnalysisStatusLabelKey {
  switch (status) {
    case 'PENDING':
      return 'list.processing';
    case 'COMPLETED':
      return 'list.completed';
    case 'FAILED':
      return 'list.failed';
  }
}

export function isAnalysisReportOpenable(status: AnalysisStatus): boolean {
  return status === 'COMPLETED';
}

export function parseAnalysisReportId(value: string | undefined): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export type AnalysisDetailPresentationState =
  | 'loading'
  | 'loadError'
  | 'completed'
  | 'failed'
  | 'pending';

interface AnalysisDetailPresentationInput {
  reportId: number | null;
  isLoading: boolean;
  isError: boolean;
  detail?: AnalysisDetailDto;
}

export function getAnalysisDetailPresentationState({
  reportId,
  isLoading,
  isError,
  detail,
}: AnalysisDetailPresentationInput): AnalysisDetailPresentationState {
  if (reportId == null) return 'loadError';
  if (isLoading) return 'loading';
  if (isError || !detail) return 'loadError';

  switch (detail.status) {
    case 'PENDING':
      return 'pending';
    case 'FAILED':
      return 'failed';
    case 'COMPLETED':
      return detail.result?.trim() ? 'completed' : 'loadError';
  }
}
