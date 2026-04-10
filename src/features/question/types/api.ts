export interface QuestionCandidateDto {
  questionId: number;
  content: string;
  description: string | null;
  receivedOrder: number;
  selected: boolean;
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

export interface ServeDailyQuestionResponse {
  dailyQuestionId: number;
  questionId: number;
  content: string;
  description: string | null;
  questionCycle: number;
  changeCount: number;
  liked: boolean;
  candidates: QuestionCandidateDto[];
}

export interface CreateAnswerRequest {
  answer: string;
  publish?: boolean;
}

export interface CreateAnswerResponse {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
  published: boolean;
}

export interface UpdateAnswerRequest {
  answer: string;
  publish?: boolean;
}

export interface UpdateAnswerResponse {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
  published: boolean;
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
}

export interface QuestionHistoryAnswerDto {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
  published: boolean;
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
