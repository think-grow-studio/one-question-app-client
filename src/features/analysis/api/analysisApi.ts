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
 * 생성 API는 명세가 확정됐지만 **조회 계열(가용성/결과/히스토리/피드백)이 아직 없다.**
 * 지금 false로 바꾸면 요청만 실서버로 가고 결과 폴링은 mock을 보게 되어 화면이 어긋난다.
 * 조회 명세가 오면 그 부분을 맞춘 뒤 이 플래그를 끈다.
 */
export const USE_MOCK_ANALYSIS = true;

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

export const analysisApi: AnalysisApi = USE_MOCK_ANALYSIS
  ? mockAnalysisApi
  : realAnalysisApi;
