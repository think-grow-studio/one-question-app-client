import { apiClient } from '@/services/apiClient';
import type {
  AnalysisAvailability,
  AnalysisDetailDto,
  AnalysisFeedback,
  AnalysisHistoryResponse,
  CreateAnalysisRequest,
  CreateAnalysisResponse,
} from '../types/api';
import { mockAnalysisApi } from './mockAnalysis';

/**
 * 조회 계열(가용성/결과/히스토리/피드백)은 서버 명세가 아직 없어 mock으로 둔다.
 * **생성만 실서버에 연결**한다 — SQS 적재와 워커 동작을 실제로 확인하기 위해서다.
 *
 * 그래서 지금은 반쪽 상태다:
 * - 생성이 돌려주는 analysisReportId는 **실서버 id**인데 조회는 mock이라 그 id를 모른다.
 *   결과 화면으로 들어가면 mock이 "not found"로 거절한다.
 * - mock에 기록이 남지 않으므로 랜딩 가용성은 계속 IDLE이다 (연속 요청이 가능해
 *   큐 적재 반복 테스트에는 오히려 편하다).
 *
 * 조회 명세가 오면 이 합성을 지우고 realAnalysisApi를 그대로 내보낸다.
 */
export const USE_MOCK_ANALYSIS_READS = true;

export interface AnalysisApi {
  getAvailability(): Promise<AnalysisAvailability>;
  /**
   * @param idempotencyKey 사용자의 "생성" 액션 1회당 1개. 네트워크 재시도에는 같은 키를
   *   재사용해야 리포트가 중복 생성되지 않는다 (useCreateAnalysis가 발급).
   */
  createAnalysis(
    req: CreateAnalysisRequest,
    idempotencyKey: string
  ): Promise<CreateAnalysisResponse>;
  getAnalysis(id: number): Promise<AnalysisDetailDto>;
  getHistory(cursor?: number | null): Promise<AnalysisHistoryResponse>;
  submitFeedback(id: number, feedback: AnalysisFeedback): Promise<void>;
}

const realAnalysisApi: AnalysisApi = {
  getAvailability: () =>
    apiClient
      .get<AnalysisAvailability>('/api/v1/analyses/availability')
      .then((res) => res.data),

  // 202 Accepted — 접수만 확인된다. 결과는 별도 조회로 폴링.
  createAnalysis: (req, idempotencyKey) =>
    apiClient
      .post<CreateAnalysisResponse>('/api/v1/analysis-reports', req, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      .then((res) => res.data),

  getAnalysis: (id) =>
    apiClient
      .get<AnalysisDetailDto>(`/api/v1/analyses/${id}`)
      .then((res) => res.data),

  getHistory: (cursor) =>
    apiClient
      .get<AnalysisHistoryResponse>('/api/v1/analyses', {
        params: cursor ? { cursor } : undefined,
      })
      .then((res) => res.data),

  submitFeedback: (id, feedback) =>
    apiClient
      .post(`/api/v1/analyses/${id}/feedback`, { feedback })
      .then(() => undefined),
};

export const analysisApi: AnalysisApi = USE_MOCK_ANALYSIS_READS
  ? { ...mockAnalysisApi, createAnalysis: realAnalysisApi.createAnalysis }
  : realAnalysisApi;
