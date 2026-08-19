import type { CreateAnalysisRequest } from '../types/api';

/**
 * "같은 생성 의도"를 판별해 멱등키의 수명을 정하는 순수 로직.
 *
 * 왜 호출당 새 키로는 부족한가: 자동 재시도(5xx/타임아웃)까지는 TanStack이 같은
 * variables를 재사용해 막아주지만, **그 재시도마저 실패해 사용자가 에러를 보고 다시
 * 제출하는 경우**는 못 막는다. 서버가 첫 요청을 실제로 받았다면 리포트가 두 건 생긴다.
 * apiClient 타임아웃이 5초라 현실적으로 일어날 수 있다.
 *
 * 그래서 키는 "성공할 때까지" 유지하되, **payload가 바뀌면 반드시 새로 발급**해야 한다.
 * 같은 키에 다른 내용을 보내면 서버가 409(BACKGROUND-JOB-003)로 거절하기 때문이다.
 */
export interface PendingCreateKey {
  key: string;
  /** 이 키가 어떤 payload에 묶여 있는지 */
  signature: string;
}

/**
 * payload 동일성 지문. 답변 ID 순서는 서버가 정규화하므로 여기서도 정렬해
 * "순서만 다른 같은 요청"을 같은 의도로 본다.
 */
export function payloadSignature(req: CreateAnalysisRequest): string {
  const ids = [...req.dailyQuestionAnswerIds].sort((a, b) => a - b).join(',');
  return `${req.reportType}:${ids}`;
}

/**
 * 이번 제출에 쓸 멱등키를 정한다.
 * 진행 중인 키가 같은 payload에 묶여 있으면 재사용, 아니면 새로 발급한다.
 *
 * @param pending 아직 성공하지 않은 직전 제출의 키 (없으면 null)
 * @param generateKey 키 생성기 — 테스트에서 주입할 수 있도록 인자로 받는다
 */
export function resolveIdempotencyKey(
  pending: PendingCreateKey | null,
  req: CreateAnalysisRequest,
  generateKey: () => string
): PendingCreateKey {
  const signature = payloadSignature(req);
  if (pending && pending.signature === signature) return pending;
  return { key: generateKey(), signature };
}
