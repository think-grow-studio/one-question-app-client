import { apiClient } from '@/services/apiClient';
import type {
  ServeDailyQuestionResponse,
  CreateAnswerRequest,
  CreateAnswerResponse,
  UpdateAnswerRequest,
  UpdateAnswerResponse,
  GetQuestionHistoryResponse,
  HistoryDirection,
} from '@/types/api';

// Question API
export const questionApi = {
  serveDailyQuestion: (date: string) =>
    apiClient.get<ServeDailyQuestionResponse>(`/api/v1/questions/daily/${date}`),

  reloadDailyQuestion: (date: string) =>
    apiClient.post<ServeDailyQuestionResponse>(
      `/api/v1/questions/daily/${date}/reload`
    ),

  createAnswer: (date: string, data: CreateAnswerRequest) =>
    apiClient.post<CreateAnswerResponse>(
      `/api/v1/questions/daily/${date}/answer`,
      data
    ),

  updateAnswer: (date: string, data: UpdateAnswerRequest) =>
    apiClient.patch<UpdateAnswerResponse>(
      `/api/v1/questions/daily/${date}/answer`,
      data
    ),

  getHistories: (params: {
    baseDate: string;
    historyDirection?: HistoryDirection;
    size?: number;
  }) =>
    apiClient.get<GetQuestionHistoryResponse>('/api/v1/questions/histories', {
      params,
    }),
};
