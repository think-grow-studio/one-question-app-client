import { apiClient } from '@/services/apiClient';
import { CATEGORIES } from '../constants/categories';
import { QuestionCategory } from '../types/category';
import type {
  ServeDailyQuestionResponse,
  CreateAnswerRequest,
  CreateAnswerResponse,
  UpdateAnswerRequest,
  UpdateAnswerResponse,
  GetQuestionHistoryResponse,
  HistoryDirection,
} from '@/types/api';

// 카테고리 API (Mock - 추후 백엔드 연동)
export async function fetchQuestionCategories(): Promise<QuestionCategory[]> {
  return Promise.resolve([...CATEGORIES]);
}

// Question API
export const questionApi = {
  getDailyQuestion: (date: string) =>
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
