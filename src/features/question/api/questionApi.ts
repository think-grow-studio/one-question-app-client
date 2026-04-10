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
};
