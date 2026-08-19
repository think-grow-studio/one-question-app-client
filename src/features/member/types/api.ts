export interface UpdateMemberRequest {
  fullName?: string;
  locale?: string;
}

export type AuthProvider = 'GOOGLE' | 'APPLE' | 'ANONYMOUS';

export enum MemberPermission {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}
export type MemberStatus = 'ACTIVE' | 'BLOCKED' | 'WITHDRAWAL_REQUESTED';

export interface NotificationSetting {
  alarmTime: string; // "HH:mm"
  timezone: string; // e.g. "Asia/Seoul"
  enabled: boolean; // 하루 질문 리마인드
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
