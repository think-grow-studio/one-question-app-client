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

export interface AnonymousAuthRequest {
  idToken: string;
}

export interface CheckGoogleLinkRequest {
  idToken: string;
}

export interface CheckGoogleLinkResponse {
  exists: boolean;
}

export interface LinkToGoogleRequest {
  idToken: string;
  email?: string;
  name?: string;
}

// ============================================
// Member Types
// ============================================

export type AuthProvider = 'GOOGLE' | 'APPLE' | 'ANONYMOUS';

export enum MemberPermission {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}
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
  questionId: number;
  content: string;
  description: string | null;
  questionCycle: number;
  changeCount: number;
  liked: boolean;
}

export interface CreateAnswerRequest {
  answer: string;
  publish?: boolean;
}

export interface CreateAnswerResponse {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
  published?: boolean;
}

export interface UpdateAnswerRequest {
  answer: string;
  publish?: boolean;
}

export interface UpdateAnswerResponse {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
  published?: boolean;
}

export type HistoryStatus = 'ANSWERED' | 'UNANSWERED' | 'NO_QUESTION';
export type HistoryDirection = 'PREVIOUS' | 'NEXT' | 'BOTH';

export interface QuestionInfoDto {
  dailyQuestionId: number;
  questionId: number;
  content: string;
  description: string | null;
  questionCycle: number;
  changeCount: number;
  liked: boolean;
}

export interface AnswerInfoDto {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
  published?: boolean;
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

// ============================================
// App Version Types
// ============================================

export type PlatformType = 'ios' | 'android';

export interface AppVersionCheckResponse {
  latestVersion: string;
  minVersion: string;
  serverLive: boolean;
}

// ============================================
// Feed Types (모두의 생각) — AnswerPost API
// ============================================

export interface AnswerPostFeedItemDto {
  answerPostId: number;
  questionContent: string;
  description: string | null;
  answerContent: string;
  anonymousNickname: string;
  postedAt: string;
  likeCount: number;
  liked: boolean;
  mine: boolean;
}

export interface AnswerPostFeedResponse {
  items: AnswerPostFeedItemDto[];
  hasNext: boolean;
  nextCursor: string | null;
}

export interface ToggleLikeResponse {
  liked: boolean;
}

