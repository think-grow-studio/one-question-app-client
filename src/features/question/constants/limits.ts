// member/public.ts가 아닌 types/api.ts에서 직접 가져온다 — public.ts는 useMemberMe를
// 재수출하며 apiClient/storage(AsyncStorage) 체인을 로드하므로, 여기서 그걸 타면 이
// 순수 로직 파일의 단위 테스트가 네이티브 모듈 의존성을 강제로 물게 된다.
import { MemberPermission } from '@/features/member/types/api';

export const LIKE_POP_MIN_COUNT = 1;

/**
 * 멤버십 등급별 질문 reload 제한
 *
 * - FREE: 2회 시작 (2 → 1 → 0)
 * - PREMIUM: 4회 시작 (4 → 3 → 2 → 1 → 0)
 */
export const QUESTION_RELOAD_LIMITS: Record<MemberPermission, number> = {
  [MemberPermission.FREE]: 2,
  [MemberPermission.PREMIUM]: 4,
};

/**
 * 멤버십 등급에 따른 최대 reload 횟수 반환
 */
export function getMaxReloadCount(permission: MemberPermission): number {
  return QUESTION_RELOAD_LIMITS[permission];
}

/**
 * Reload 가능 여부 확인
 * changeCount는 사용한 횟수이므로, max보다 작으면 아직 리로드 가능
 */
export function canReloadQuestion(
  currentChangeCount: number,
  permission: MemberPermission
): boolean {
  const maxCount = getMaxReloadCount(permission);
  return currentChangeCount < maxCount;
}

/**
 * Reload count 뱃지 표시용 정보
 * remaining = max - 사용한 횟수
 *
 * @example
 * getReloadCountDisplay(0, 'FREE') // { remaining: 2, max: 2 }
 * getReloadCountDisplay(1, 'FREE') // { remaining: 1, max: 2 }
 * getReloadCountDisplay(1, 'PREMIUM') // { remaining: 3, max: 4 }
 */
export function getReloadCountDisplay(
  currentChangeCount: number,
  permission: MemberPermission
): { remaining: number; max: number } {
  const max = getMaxReloadCount(permission);
  return {
    remaining: Math.max(0, max - currentChangeCount),
    max,
  };
}
