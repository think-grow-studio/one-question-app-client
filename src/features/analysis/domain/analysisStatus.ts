import type { AnalysisStatus } from '../types/api';

/**
 * 아직 결과가 나오지 않아 계속 지켜봐야 하는 상태.
 *
 * 서버 생성 API는 접수 직후 `PENDING`을 돌려주고, 조회 계열 명세는 아직 없다.
 * 폴링을 `status === 'PROCESSING'` 처럼 한 값에만 걸면 PENDING 구간에서 폴링이
 * 멈춰 결과 화면이 영영 갱신되지 않는다. 진행 중 판정은 반드시 이 함수를 거칠 것.
 */
export function isAnalysisInProgress(status: AnalysisStatus): boolean {
  return status === 'PENDING' || status === 'PROCESSING';
}
