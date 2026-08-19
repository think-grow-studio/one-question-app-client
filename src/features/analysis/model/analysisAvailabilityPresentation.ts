import type { AnalysisAvailability } from '../types/api';

const DAY_MS = 24 * 60 * 60 * 1000;

/** COOLDOWN 상태일 때 다음 요청 가능일까지 남은 일수 (최소 1일로 올림). */
export function getCooldownDays(
  nextAvailableAt: string | null,
  now: number = Date.now()
): number {
  if (!nextAvailableAt) return 0;
  return Math.max(1, Math.ceil((new Date(nextAvailableAt).getTime() - now) / DAY_MS));
}

export type AnalysisStatusMessage =
  | { key: 'status.locked.progress'; params: { current: number; required: number } }
  | { key: 'status.cooldown.message'; params: { days: number } }
  | { key: 'list.processingHint' }
  | null;

/**
 * 가용성 판정 사유 → 화면에 표시할 안내 문구의 i18n key/params.
 * 번역 실행(t 호출)은 화면 레이어 책임 — 이 함수는 어떤 key/params를 쓸지만 결정한다.
 */
export function getAnalysisStatusMessage(
  availability: AnalysisAvailability | undefined
): AnalysisStatusMessage {
  if (!availability) return null;

  switch (availability.reason) {
    case 'INSUFFICIENT_ANSWERS':
      return {
        key: 'status.locked.progress',
        params: { current: availability.answerCount, required: availability.requiredCount },
      };
    case 'COOLDOWN':
      return {
        key: 'status.cooldown.message',
        params: { days: getCooldownDays(availability.nextAvailableAt) },
      };
    case 'PROCESSING':
      return { key: 'list.processingHint' };
    case 'OK':
      return null;
  }
}
