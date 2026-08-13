import type { AnalysisStatus } from '../types/api';

interface StatusColors {
  light: string;
  dark: string;
}

/** 상태 텍스트와 진행 인디케이터에만 쓰는 라이트/다크 대비 팔레트. */
const STATUS_COLORS: Record<AnalysisStatus, StatusColors> = {
  PENDING: { light: '#9A6200', dark: '#F0B95B' },
  COMPLETED: { light: '#2F7D5A', dark: '#72D3A2' },
  FAILED: { light: '#C94B4B', dark: '#FF8A8A' },
};

export function getAnalysisStatusColor(
  status: AnalysisStatus,
  dark: boolean,
): string {
  return dark ? STATUS_COLORS[status].dark : STATUS_COLORS[status].light;
}
