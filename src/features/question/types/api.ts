export interface QuestionCandidateDto {
  questionId: number;
  content: string;
  description: string | null;
  receivedOrder: number;
  selected: boolean;
  likeCount?: number;
}

export interface SelectQuestionRequest {
  questionId: number;
}

export interface CheckCandidateCycleRequest {
  questionId: number;
}

export interface CheckCandidateCycleResponse {
  alreadyAssignedInCycle: boolean;
  previouslyAssignedDates: string[];
}

// 과거 질문 — 이전 사이클들의 같은 날(작년 오늘, 재작년 오늘, ...)에 최종 확정됐던 질문.
export interface PastQuestionDto {
  questionId: number;
  content: string;
  description: string | null;
  assignedDates: string[]; // YYYY-MM-DD, 최신순
  inCandidates: boolean; // 오늘 후보에 이미 있음 → 재할당 시 변경 횟수 차감 없음
}

export interface GetPastQuestionsResponse {
  available: boolean;
  message: string | null; // available=false 일 때 노출할 안내 문구 (Accept-Language 기준)
  questions: PastQuestionDto[];
}

export interface SelectPastQuestionRequest {
  questionId: number;
}

export interface ServeDailyQuestionResponse {
  dailyQuestionId: number;
  questionId: number;
  content: string;
  description: string | null;
  questionCycle: number;
  changeCount: number;
  liked: boolean;
  likeCount?: number;
  candidates: QuestionCandidateDto[];
}

export interface CreateAnswerRequest {
  answer: string;
}

export interface CreateAnswerResponse {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
}

export interface UpdateAnswerRequest {
  answer: string;
}

export interface UpdateAnswerResponse {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
}

export type HistoryStatus = 'ANSWERED' | 'UNANSWERED' | 'NO_QUESTION';
export type HistoryDirection = 'PREVIOUS' | 'NEXT' | 'BOTH';

export interface QuestionHistoryQuestionDto {
  dailyQuestionId: number;
  questionId: number;
  content: string;
  description: string | null;
  questionCycle: number;
  changeCount: number;
  liked: boolean;
  likeCount?: number;
}

export interface QuestionHistoryAnswerDto {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
}

export interface QuestionHistoryItemDto {
  date: string;
  status: HistoryStatus;
  question: QuestionHistoryQuestionDto | null;
  answer: QuestionHistoryAnswerDto | null;
  candidates: QuestionCandidateDto[] | null;
}

export interface GetQuestionHistoryResponse {
  histories: QuestionHistoryItemDto[];
  hasPrevious: boolean;
  hasNext: boolean;
  startDate: string;
  endDate: string;
}
