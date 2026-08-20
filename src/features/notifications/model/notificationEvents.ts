export type NotificationEvent =
  | { type: 'ANALYSIS_DONE'; analysisId?: string }
  | { type: 'OTHER' };

/**
 * FCM remoteMessage.data(raw payload)를 typed event로 변환한다.
 * analysisId 유무와 무관하게 type만으로 ANALYSIS_DONE을 판정한다
 * (기존 invalidate 로직과 동일한 기준 유지 — analysisId는 부가 정보).
 */
export function parseNotificationEvent(
  data: Record<string, unknown> | undefined
): NotificationEvent {
  if (data?.type === 'ANALYSIS_DONE') {
    return {
      type: 'ANALYSIS_DONE',
      analysisId: typeof data.analysisId === 'string' ? data.analysisId : undefined,
    };
  }

  return { type: 'OTHER' };
}
