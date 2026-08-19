import { apiClient } from '@/platform/http/apiClient';
import type {
  AnalysisAvailability,
  AnalysisDetailDto,
  AnalysisHistoryResponse,
  CreateAnalysisRequest,
  CreateAnalysisResponse,
} from '../types/api';
import { getMockAnalysisAvailability } from './mockAnalysis';

/**
 * 가용성 API만 서버에 없어 mock을 사용한다.
 * 생성·목록·상세는 모두 AnalysisReport 실서버 계약을 사용한다.
 */
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
}

export const analysisApi: AnalysisApi = {
  getAvailability: getMockAnalysisAvailability,

  // 202 Accepted — 접수만 확인된다. 완료는 FCM invalidate/포그라운드 refetch로 반영한다.
  createAnalysis: (req, idempotencyKey) =>
    apiClient
      .post<CreateAnalysisResponse>('/api/v1/analysis-reports', req, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      .then((res) => res.data),

  getAnalysis: (id) =>
    apiClient
      .get<AnalysisDetailDto>(`/api/v1/analysis-reports/${id}`)
      .then((res) => res.data),

  getHistory: (cursor) =>
    apiClient
      .get<AnalysisHistoryResponse>('/api/v1/analysis-reports', {
        params: cursor == null ? undefined : { cursor },
      })
      .then((res) => res.data),
};
