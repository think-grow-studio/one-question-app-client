import type { AnalysisStatus } from '../types/api';

/**
 * 아직 결과가 나오지 않아 계속 지켜봐야 하는 상태.
 *
 * 서버는 접수와 처리 중을 모두 `PENDING`으로 표현한다.
 */
export function isAnalysisInProgress(status: AnalysisStatus): boolean {
  return status === 'PENDING';
}
