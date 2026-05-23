import { apiClient } from '@/services/apiClient';
import type {
  PublicAnswerListDto,
  PublicAnswerWriteDto,
  PublicDailyQuestionDto,
  ToggleLikeDto,
} from '../types/api';

// 서버 스펙: /api/v1/public-questions/*
// Authorization, Timezone, Accept-Language 헤더는 apiClient 인터셉터가 자동 주입.

const BASE = '/api/v1/public-questions';

export interface ListAnswersParams {
  cursorAnsweredAt?: string;
  cursorId?: number;
  size?: number;
}

export const publicQuestionApi = {
  getDaily: (date: string) =>
    apiClient.get<PublicDailyQuestionDto>(`${BASE}/daily/${date}`),

  createAnswer: (pdqId: number, content: string) =>
    apiClient.post<PublicAnswerWriteDto>(`${BASE}/${pdqId}/answers`, { content }),

  updateAnswer: (pdqId: number, answerId: number, content: string) =>
    apiClient.patch<PublicAnswerWriteDto>(
      `${BASE}/${pdqId}/answers/${answerId}`,
      { content },
    ),

  deleteAnswer: (pdqId: number, answerId: number) =>
    apiClient.delete<void>(`${BASE}/${pdqId}/answers/${answerId}`),

  listAnswers: (pdqId: number, params: ListAnswersParams = {}) =>
    apiClient.get<PublicAnswerListDto>(`${BASE}/${pdqId}/answers`, { params }),

  toggleLike: (pdqId: number, answerId: number) =>
    apiClient.post<ToggleLikeDto>(`${BASE}/${pdqId}/answers/${answerId}/like`),
};
