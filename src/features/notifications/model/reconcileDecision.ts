/**
 * FCM 토큰 정합성 판단 — 순수 로직.
 *
 * 실행(useFCMReconciliation)에서 분리한 이유: 이 판단이 틀려도 **아무것도 깨지지 않는다.**
 * 크래시도 에러 화면도 없이 알림만 조용히 사라지고, 사용자는 신고하지 않는다.
 * Crashlytics가 잡아줄 게 없는 종류의 버그라 테스트가 유일한 그물이다.
 */

export interface NotificationIntent {
  /** 하루 질문 리마인드 */
  reminder: boolean;
  /** AI 분석 리포트 완료 알림 */
  report: boolean;
}

export interface ReconcileInput {
  /** OS 알림 권한이 허용되어 있는가 (undetermined/denied 모두 false) */
  permissionGranted: boolean;
  /** 서버 등록에 성공해 store가 기억하고 있는 토큰 */
  storedToken: string | null;
  intent: NotificationIntent;
  /** FCM SDK가 준 현재 토큰. 조회하지 않았거나 받지 못했으면 null */
  sdkToken: string | null;
}

export type ReconcileSkipReason =
  | 'no-token-to-delete'
  | 'no-category-wanted'
  | 'sdk-token-unavailable'
  | 'token-already-current';

export type ReconcileAction =
  | { type: 'none'; reason: ReconcileSkipReason }
  | { type: 'delete'; token: string }
  | { type: 'register'; token: string };

/**
 * SDK 토큰을 조회할 필요가 있는지. 네이티브 왕복이라 불필요하면 건너뛴다.
 * 호출자가 조회 여부를 정할 때와 decideReconcileAction이 판단할 때 같은 규칙을 쓴다.
 */
export function needsSdkToken(
  permissionGranted: boolean,
  intent: NotificationIntent
): boolean {
  return permissionGranted && (intent.reminder || intent.report);
}

/**
 * 지금 상태에서 토큰에 무엇을 해야 하는지 결정한다. 멱등 — 같은 입력이면 같은 결정.
 *
 * 규칙 세 줄:
 * 1. 권한이 없으면 서버 토큰을 뗀다 (설정값은 절대 건드리지 않는다 — 의사 보존).
 * 2. 원하는 카테고리가 하나도 없으면 새로 심지 않는다. 단 이미 있는 건 그대로 둔다.
 * 3. 그 외에는 SDK 토큰과 서버에 등록된 토큰을 일치시킨다.
 */
export function decideReconcileAction(input: ReconcileInput): ReconcileAction {
  const { permissionGranted, storedToken, intent, sdkToken } = input;

  // 1. 권한 없음 → 전송 경로를 끊는다. 카테고리 설정과 무관하게 권한이 우선한다.
  if (!permissionGranted) {
    return storedToken
      ? { type: 'delete', token: storedToken }
      : { type: 'none', reason: 'no-token-to-delete' };
  }

  // 2. 아무 카테고리도 원하지 않음 → 새 토큰을 심지 않는다.
  //    기존 토큰을 지우지는 않는다: 카테고리 차단은 서버 발송 필터의 몫이고,
  //    토큰을 남겨야 재활성화가 매끄럽다 (useDisableNotificationMutation과 일관).
  if (!needsSdkToken(permissionGranted, intent)) {
    return { type: 'none', reason: 'no-category-wanted' };
  }

  // 3. 토큰 일치시키기
  if (!sdkToken) {
    return { type: 'none', reason: 'sdk-token-unavailable' };
  }
  if (sdkToken === storedToken) {
    return { type: 'none', reason: 'token-already-current' };
  }
  return { type: 'register', token: sdkToken };
}
