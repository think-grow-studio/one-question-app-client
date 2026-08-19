import {
  payloadSignature,
  resolveIdempotencyKey,
  type PendingCreateKey,
} from '../createRequestIdentity';
import type { CreateAnalysisRequest } from '../../types/api';

const req = (
  overrides: Partial<CreateAnalysisRequest> = {}
): CreateAnalysisRequest => ({
  reportType: 'THINKING_PATTERN',
  dailyQuestionAnswerIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  ...overrides,
});

/** 호출할 때마다 다른 키를 주는 생성기 — 재사용 여부를 눈으로 구분하기 위해 */
function counterGenerator() {
  let n = 0;
  return () => `key-${++n}`;
}

describe('payloadSignature', () => {
  it('답변 ID 순서가 달라도 같은 지문이다 (서버가 정규화하므로)', () => {
    const a = payloadSignature(req({ dailyQuestionAnswerIds: [3, 1, 2] }));
    const b = payloadSignature(req({ dailyQuestionAnswerIds: [1, 2, 3] }));
    expect(a).toBe(b);
  });

  it('선택한 답변이 다르면 다른 지문이다', () => {
    const a = payloadSignature(req({ dailyQuestionAnswerIds: [1, 2, 3] }));
    const b = payloadSignature(req({ dailyQuestionAnswerIds: [1, 2, 4] }));
    expect(a).not.toBe(b);
  });

  it('리포트 종류가 다르면 다른 지문이다', () => {
    const a = payloadSignature(req({ reportType: 'THINKING_PATTERN' }));
    const b = payloadSignature(req({ reportType: 'WARM_REFLECTION' }));
    expect(a).not.toBe(b);
  });
});

describe('resolveIdempotencyKey', () => {
  it('진행 중인 키가 없으면 새로 발급한다', () => {
    const gen = counterGenerator();
    expect(resolveIdempotencyKey(null, req(), gen).key).toBe('key-1');
  });

  // 핵심 회귀 방지: 이게 깨지면 사용자가 에러 후 다시 제출할 때 리포트가 중복 생성된다.
  it('같은 payload로 다시 제출하면 키를 재사용한다 (수동 재시도)', () => {
    const gen = counterGenerator();
    const first = resolveIdempotencyKey(null, req(), gen);
    const second = resolveIdempotencyKey(first, req(), gen);

    expect(second.key).toBe(first.key);
    expect(second.key).toBe('key-1'); // 생성기가 다시 불리지 않았다
  });

  it('답변 순서만 바꿔 다시 제출해도 키를 재사용한다', () => {
    const gen = counterGenerator();
    const first = resolveIdempotencyKey(
      null,
      req({ dailyQuestionAnswerIds: [1, 2, 3] }),
      gen
    );
    const second = resolveIdempotencyKey(
      first,
      req({ dailyQuestionAnswerIds: [3, 2, 1] }),
      gen
    );
    expect(second.key).toBe(first.key);
  });

  // 이게 깨지면 서버가 409(BACKGROUND-JOB-003)로 거절한다 — 같은 키에 다른 내용.
  it('선택을 바꿔 제출하면 새 키를 발급한다', () => {
    const gen = counterGenerator();
    const first = resolveIdempotencyKey(
      null,
      req({ dailyQuestionAnswerIds: [1, 2, 3] }),
      gen
    );
    const second = resolveIdempotencyKey(
      first,
      req({ dailyQuestionAnswerIds: [1, 2, 4] }),
      gen
    );
    expect(second.key).not.toBe(first.key);
    expect(second.key).toBe('key-2');
  });

  it('리포트 종류를 바꿔 제출하면 새 키를 발급한다', () => {
    const gen = counterGenerator();
    const first = resolveIdempotencyKey(
      null,
      req({ reportType: 'THINKING_PATTERN' }),
      gen
    );
    const second = resolveIdempotencyKey(
      first,
      req({ reportType: 'WARM_REFLECTION' }),
      gen
    );
    expect(second.key).not.toBe(first.key);
  });

  // 성공하면 호출자가 pending을 null로 비운다 → 다음 리포트는 새 키여야 한다.
  it('성공 후(pending=null) 같은 payload를 다시 보내면 새 키를 발급한다', () => {
    const gen = counterGenerator();
    const first = resolveIdempotencyKey(null, req(), gen);

    const afterSuccess: PendingCreateKey | null = null;
    const second = resolveIdempotencyKey(afterSuccess, req(), gen);

    expect(second.key).not.toBe(first.key);
  });
});
