import { MIN_ANSWERS } from '../constants/analysisTypes';
import type { AnalysisAvailability } from '../types/api';

/**
 * 가용성 조회는 아직 서버 API가 없다.
 * 생성 가능한 기본 상태만 제공하고, 리포트 생성·조회 데이터는 저장하지 않는다.
 */
export function getMockAnalysisAvailability(): Promise<AnalysisAvailability> {
  return Promise.resolve({
    canRequest: true,
    reason: 'OK',
    answerCount: 15,
    requiredCount: MIN_ANSWERS,
    nextAvailableAt: null,
    processingId: null,
  });
}
