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
  authorizationCode?: string;
  rawNonce?: string;
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

export interface CheckAppleLinkRequest {
  identityToken: string;
  rawNonce?: string;
}

export interface CheckAppleLinkResponse {
  exists: boolean;
}

export interface LinkToAppleRequest {
  identityToken: string;
  name?: string;
  authorizationCode?: string;
  rawNonce?: string;
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

export interface NotificationSetting {
  alarmTime: string;  // "HH:mm"
  timezone: string;   // e.g. "Asia/Seoul"
  enabled: boolean;   // 하루 질문 리마인드
  // AI 분석 리포트 완료 알림. 서버 미배포 동안 optional —
  // 응답에 없으면 클라이언트는 useNotificationStore의 로컬 값을 fallback으로 쓴다.
  analysisReportEnabled?: boolean;
}

export interface GetMemberResponse {
  id: number;
  publicId: string;
  email: string;
  fullName: string;
  provider: AuthProvider;
  locale: string;
  permission: MemberPermission;
  status: MemberStatus;
  joinedDate: string;
  cycleStartDate: string;
  notificationSetting: NotificationSetting | null;
}

export interface UpdateMemberRequest {
  fullName?: string;
  locale?: string;
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

