import * as Crypto from 'expo-crypto';

/**
 * 멱등키 발급 — 서버가 "같은 생성 의도의 재시도"를 판별하는 데 쓰는 UUID.
 *
 * 플랫폼 모듈을 feature 코드에서 직접 부르지 않도록 여기서 감싼다. 멱등키는 분석 전용
 * 개념이 아니라 생성 계열 POST가 공통으로 쓰는 것이라 shared에 둔다.
 *
 * **주의: 호출할 때마다 새 키다.** 재시도에 같은 키를 유지하는 책임은 호출자에게 있다
 * (분석 요청의 경우 features/analysis/model/createRequestIdentity 참고).
 */
export function newIdempotencyKey(): string {
  return Crypto.randomUUID();
}
