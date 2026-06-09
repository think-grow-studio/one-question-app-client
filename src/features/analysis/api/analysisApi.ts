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
 * 서버 API 미확정 구간 — mock 레이어로 동작.
 * 백엔드 계약 확정 후 false 로 바꾸면 실서버 연동으로 전환된다.
 * (계약: docs/ai-analysis-feature-plan.md §6)
 */
export const USE_MOCK_ANALYSIS = true;

export interface AnalysisApi {
  getAvailability(): Promise<AnalysisAvailability>;
  createAnalysis(req: CreateAnalysisRequest): Promise<CreateAnalysisResponse>;
  getAnalysis(id: number): Promise<AnalysisDetailDto>;
  getHistory(cursor?: number | null): Promise<AnalysisHistoryResponse>;
  submitFeedback(id: number, feedback: AnalysisFeedback): Promise<void>;
}

const realAnalysisApi: AnalysisApi = {
  getAvailability: () =>
    apiClient
      .get<AnalysisAvailability>('/api/v1/analyses/availability')
      .then((res) => res.data),

  createAnalysis: (req) =>
    apiClient
      .post<CreateAnalysisResponse>('/api/v1/analyses', req)
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
