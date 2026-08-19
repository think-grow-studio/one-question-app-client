import { isAnalysisInProgress } from '../analysisStatus';

describe('isAnalysisInProgress', () => {
  // 접수 직후 상태. staleTime을 0으로 두어 FCM invalidate와
  // 포그라운드 복귀 refetch가 즉시 서버 상태를 반영하게 한다.
  it('PENDING은 진행 중이다', () => {
    expect(isAnalysisInProgress('PENDING')).toBe(true);
  });

  it('COMPLETED는 진행 중이 아니다', () => {
    expect(isAnalysisInProgress('COMPLETED')).toBe(false);
  });

  it('FAILED는 진행 중이 아니다', () => {
    expect(isAnalysisInProgress('FAILED')).toBe(false);
  });
});
