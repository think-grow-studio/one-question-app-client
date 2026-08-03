import { isAnalysisInProgress } from '../analysisStatus';

describe('isAnalysisInProgress', () => {
  // 서버 생성 API가 접수 직후 돌려주는 값. 이걸 진행 중으로 보지 않으면
  // 폴링이 시작조차 하지 않아 결과 화면이 영영 갱신되지 않는다.
  it('PENDING은 진행 중이다', () => {
    expect(isAnalysisInProgress('PENDING')).toBe(true);
  });

  it('PROCESSING은 진행 중이다', () => {
    expect(isAnalysisInProgress('PROCESSING')).toBe(true);
  });

  it('READY는 진행 중이 아니다', () => {
    expect(isAnalysisInProgress('READY')).toBe(false);
  });

  it('FAILED는 진행 중이 아니다', () => {
    expect(isAnalysisInProgress('FAILED')).toBe(false);
  });
});
