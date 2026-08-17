import type { AnalysisStatus } from '../types/api';

export interface AnalysisStatusColors {
  pending: string;
  completed: string;
  failed: string;
}

export function getAnalysisStatusColor(
  status: AnalysisStatus,
  colors: AnalysisStatusColors,
): string {
  switch (status) {
    case 'PENDING':
      return colors.pending;
    case 'COMPLETED':
      return colors.completed;
    case 'FAILED':
      return colors.failed;
  }
}
