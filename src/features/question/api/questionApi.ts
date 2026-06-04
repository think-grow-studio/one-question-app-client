import { apiClient } from '@/services/apiClient';
import type {
  CheckCandidateCycleRequest,
  CheckCandidateCycleResponse,
  CreateAnswerRequest,
  CreateAnswerResponse,
  GetQuestionHistoryResponse,
  HistoryDirection,
  SelectQuestionRequest,
  ServeDailyQuestionResponse,
  UpdateAnswerRequest,
  UpdateAnswerResponse,
} from '../types/api';

export const questionApi = {
  serveDailyQuestion: (date: string) =>
    apiClient.get<ServeDailyQuestionResponse>(`/api/v1/questions/daily/${date}`),

  reloadDailyQuestion: (date: string) =>
    apiClient.post<ServeDailyQuestionResponse>(`/api/v1/questions/daily/${date}/reload`),

  selectQuestion: (date: string, data: SelectQuestionRequest) =>
    apiClient.patch<ServeDailyQuestionResponse>(`/api/v1/questions/daily/${date}`, data),

  checkCandidateCycle: (date: string, data: CheckCandidateCycleRequest) =>
    apiClient.post<CheckCandidateCycleResponse>(
      `/api/v1/questions/daily/${date}/candidates/cycle-check`,
      data
    ),

  createAnswer: (date: string, data: CreateAnswerRequest) =>
    apiClient.post<CreateAnswerResponse>(`/api/v1/questions/daily/${date}/answer`, data),

  updateAnswer: (date: string, data: UpdateAnswerRequest) =>
    apiClient.patch<UpdateAnswerResponse>(`/api/v1/questions/daily/${date}/answer`, data),

  getHistories: (params: {
    baseDate: string;
    historyDirection?: HistoryDirection;
    size?: number;
  }) =>
    apiClient.get<GetQuestionHistoryResponse>('/api/v1/questions/histories', {
      params,
    }),

  /**
   * 타임라인 조회 — baseDate(커서, 포함)부터 과거 방향으로 "기록 있는 날만" 최신순 size개.
   * histories와 달리 NO_QUESTION 항목이 없음. 빈 결과 시 startDate/endDate는 null.
   * 다음 페이지 커서 = 응답 startDate - 1일. (Timezone 헤더는 apiClient 인터셉터가 주입)
   */
  getTimeline: (params: { baseDate: string; size?: number }) =>
    apiClient.get<GetQuestionHistoryResponse>('/api/v1/questions/timelines', {
      params,
    }),
};
