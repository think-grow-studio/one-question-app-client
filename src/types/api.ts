// API 에러 응답 (서버 ExceptionResponse 구조)
export interface ApiErrorResponse {
  traceId: string;
  status: number;
  code: string;
  message: string;
}

// 페이지네이션 응답 (필요시 사용)
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}


// ============================================
// Auth Types
// ============================================

export interface GoogleAuthRequest {
  idToken: string;
  email?: string;
  name?: string;
}

export interface AppleAuthRequest {
  identityToken: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  isNewMember: boolean;
}

export interface ReissueTokenRequest {
  refreshToken: string;
}

// ============================================
// Member Types
// ============================================

export type AuthProvider = 'GOOGLE' | 'APPLE';
export type MemberPermission = 'FREE' | 'PREMIUM';
export type MemberStatus = 'ACTIVE' | 'BLOCKED' | 'WITHDRAWAL_REQUESTED';

export interface GetMemberResponse {
  id: number;
  email: string;
  fullName: string;
  provider: AuthProvider;
  locale: string;
  permission: MemberPermission;
  status: MemberStatus;
  joinedDate: string;
  cycleStartDate: string;
}

export interface UpdateMemberRequest {
  fullName?: string;
  locale?: string;
}

// ============================================
// Question Types
// ============================================

export interface ServeDailyQuestionResponse {
  dailyQuestionId: number;
  content: string;
  description: string | null;
  questionCycle: number;
  changeCount: number;
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
  updatedAt: string;
}

export type HistoryStatus = 'ANSWERED' | 'UNANSWERED' | 'NO_QUESTION';
export type HistoryDirection = 'PREVIOUS' | 'NEXT' | 'BOTH';

export interface QuestionInfoDto {
  dailyQuestionId: number;
  content: string;
  description: string | null;
  questionCycle: number;
  changeCount: number;
}

export interface AnswerInfoDto {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
}

export interface QuestionHistoryItemDto {
  date: string;
  status: HistoryStatus;
  question: QuestionInfoDto | null;
  answer: AnswerInfoDto | null;
}

export interface GetQuestionHistoryResponse {
  histories: QuestionHistoryItemDto[];
  hasPrevious: boolean;
  hasNext: boolean;
  startDate: string;
  endDate: string;
}
