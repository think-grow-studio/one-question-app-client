import { apiClient } from '@/platform/http/apiClient';
import type {
  CheckCandidateCycleRequest,
  CheckCandidateCycleResponse,
  CreateAnswerRequest,
  CreateAnswerResponse,
  GetPastQuestionsResponse,
  GetQuestionHistoryResponse,
  HistoryDirection,
  SelectPastQuestionRequest,
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

  getPastQuestions: (date: string) =>
    apiClient.get<GetPastQuestionsResponse>(`/api/v1/questions/daily/${date}/past`),

  /** 그날 질문이 아직 없을 때 과거 질문으로 첫 질문 받기 (변경 횟수 차감 없음). */
  servePastQuestion: (date: string, data: SelectPastQuestionRequest) =>
    apiClient.post<ServeDailyQuestionResponse>(`/api/v1/questions/daily/${date}/past`, data),

  /** 이미 질문이 있을 때 과거 질문으로 재할당 (오늘 후보에 없던 질문이면 변경 횟수 1회 차감). */
  reloadPastQuestion: (date: string, data: SelectPastQuestionRequest) =>
    apiClient.post<ServeDailyQuestionResponse>(
      `/api/v1/questions/daily/${date}/past/reload`,
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
