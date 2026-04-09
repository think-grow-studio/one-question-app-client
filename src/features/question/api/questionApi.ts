import { apiClient } from '@/services/apiClient';
import type {
  ServeDailyQuestionResponse,
  CreateAnswerRequest,
  CreateAnswerResponse,
  UpdateAnswerRequest,
  UpdateAnswerResponse,
  GetQuestionHistoryResponse,
  HistoryDirection,
  SelectCandidateResponse,
  CandidateDto,
} from '@/shared/types/api';

// ============================================
// MOCK: 서버 candidates 구현 전 임시 mock
// 서버 배포 후 이 섹션 전체 제거
// ============================================
const MOCK_ENABLED = __DEV__;

const mockCandidatesMap = new Map<string, CandidateDto[]>();
let mockCandidateIdCounter = 9000;

function getOrCreateCandidates(date: string, response: ServeDailyQuestionResponse): CandidateDto[] {
  if (!mockCandidatesMap.has(date)) {
    const initialCandidate: CandidateDto = {
      candidateId: ++mockCandidateIdCounter,
      questionId: response.questionId,
      content: response.content,
      description: response.description,
      order: 1,
      isSelected: true,
    };
    mockCandidatesMap.set(date, [initialCandidate]);
  }
  return mockCandidatesMap.get(date)!;
}

function injectCandidates(date: string, response: ServeDailyQuestionResponse): ServeDailyQuestionResponse {
  if (!MOCK_ENABLED) return response;
  const candidates = getOrCreateCandidates(date, response);
  return { ...response, candidates };
}

function addReloadCandidate(date: string, response: ServeDailyQuestionResponse): ServeDailyQuestionResponse {
  if (!MOCK_ENABLED) return response;

  const existing = mockCandidatesMap.get(date) ?? [];
  // 기존 후보 모두 unselect
  existing.forEach((c) => { c.isSelected = false; });

  const newCandidate: CandidateDto = {
    candidateId: ++mockCandidateIdCounter,
    questionId: response.questionId,
    content: response.content,
    description: response.description,
    order: existing.length + 1,
    isSelected: true,
  };
  existing.push(newCandidate);
  mockCandidatesMap.set(date, existing);

  return { ...response, candidates: existing };
}

function mockSelectCandidate(date: string, candidateId: number): SelectCandidateResponse {
  const candidates = mockCandidatesMap.get(date) ?? [];
  const target = candidates.find((c) => c.candidateId === candidateId);
  if (!target) throw new Error('INVALID_CANDIDATE');

  candidates.forEach((c) => { c.isSelected = c.candidateId === candidateId; });

  return {
    dailyQuestionId: 0,
    selectedCandidateId: candidateId,
    questionId: target.questionId,
    content: target.content,
    description: target.description,
  };
}

function injectCandidatesIntoHistories(response: GetQuestionHistoryResponse): GetQuestionHistoryResponse {
  if (!MOCK_ENABLED) return response;
  return {
    ...response,
    histories: response.histories.map((h) => {
      // 히스토리에서 처음 보는 날짜면 초기 candidate 생성
      if (h.question && !mockCandidatesMap.has(h.date)) {
        const initialCandidate: CandidateDto = {
          candidateId: ++mockCandidateIdCounter,
          questionId: h.question.questionId,
          content: h.question.content,
          description: h.question.description,
          order: 1,
          isSelected: true,
        };
        mockCandidatesMap.set(h.date, [initialCandidate]);
      }
      return {
        ...h,
        question: h.question
          ? { ...h.question, candidates: mockCandidatesMap.get(h.date) ?? [] }
          : null,
      };
    }),
  };
}
// ============================================
// END MOCK
// ============================================

// Question API
export const questionApi = {
  serveDailyQuestion: (date: string) =>
    apiClient.get<ServeDailyQuestionResponse>(`/api/v1/questions/daily/${date}`)
      .then((res) => ({ ...res, data: injectCandidates(date, res.data) })),

  reloadDailyQuestion: (date: string) =>
    apiClient.post<ServeDailyQuestionResponse>(
      `/api/v1/questions/daily/${date}/reload`
    ).then((res) => ({ ...res, data: addReloadCandidate(date, res.data) })),

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

  selectCandidate: (date: string, candidateId: number) => {
    if (MOCK_ENABLED) {
      return Promise.resolve({ data: mockSelectCandidate(date, candidateId) });
    }
    return apiClient.patch<SelectCandidateResponse>(
      `/api/v1/questions/daily/${date}/candidate`,
      { candidateId }
    );
  },

  getHistories: (params: {
    baseDate: string;
    historyDirection?: HistoryDirection;
    size?: number;
  }) =>
    apiClient.get<GetQuestionHistoryResponse>('/api/v1/questions/histories', {
      params,
    }).then((res) => ({ ...res, data: injectCandidatesIntoHistories(res.data) })),
};
