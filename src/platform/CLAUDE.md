# platform — 인프라 계약과 함정

이 폴더는 기술 인프라만 담는다 (제품 feature를 몰라야 한다 — 비즈니스 서비스는 `features/*/services/`). 에러 처리의 계층별 역할 분담은 README §6이 진실원 — 여기엔 세부 계약만.

## apiClient 계약

- **interceptor는 정규화만 한다** — 모든 에러는 `ApiErrorResponse{requestId,status,code,message}`로 reject. 사용자 표시는 `queryClient.ts`의 cache-level onError가 담당. **interceptor에 showError를 추가하지 말 것.**
- 자동 주입 헤더: `Authorization`(SecureStore), `Accept-Language`(사용자 선택 언어 우선), **`Timezone`(기기 타임존)** — 서버의 "오늘의 질문" 날짜 판정이 이 헤더 기준이다. 날짜가 어긋나는 버그는 기기 타임존부터 확인.
- timeout 5초 (refresh 요청도 별도로 5초). 서버 메시지가 없을 때의 fallback 에러 메시지는 i18n(`common:error.*`).

## 401 / 토큰 갱신

- `tokenRefreshService.refresh()`는 Promise mutex — 동시다발 401이 와도 갱신은 1회, 나머지는 같은 Promise를 기다린다.
- refresh는 **raw axios**를 쓴다 (apiClient를 쓰면 interceptor 무한루프). `/auth/reissue-token` 요청 자체는 401 재시도 대상에서 제외.
- refresh 실패 → **조용히 로그아웃** (`useAuthStore.logout()`) — 의도된 UX 결정 (코드 NOTE 참고).
- 401은 query/mutation retry 대상이 아니다 — interceptor가 이미 refresh+재시도를 끝낸 뒤이므로 queryClient에서 재시도하면 중복 요청.

## queryClient 계약

- **silent 코드는 platform이 모른다 — 각 쿼리/뮤테이션이 `meta: { suppressGlobalErrorCodes: [...] }`로 스스로 선언한다** (Phase 9에서 `SILENT_ERROR_CODES` 중앙 Set 제거, `platform → features 지식` 역전 해소). 코드를 추가하면 해당 코드의 후속 처리(refetch/dialog)는 그 mutation hook + 컴포넌트 책임 — 선언만 하고 후속 처리를 안 만들면 에러가 조용히 사라진다. `queryMeta`/`mutationMeta` 타입은 이 파일 상단 `Register` 선언 참고.
- `meta: { suppressGlobalError: true }` — 백그라운드 prefetch처럼 사용자 인터랙션 없는 조회의 실패 dialog를 생략하는 용도 (코드 무관, 그 쿼리의 모든 에러). 남용 금지 (화면이 다시 조회하면 meta 없이 정상 표시됨). `suppressGlobalErrorCodes`(코드 한정)와 헷갈리지 말 것.
- retry는 최종 실패 시에만 cache onError를 1회 호출 → dialog 중복 없음. 이 전제로 retry 정책을 바꿀 것.

## Runtime Configuration Seam (app → platform 콜백 주입)

- `apiClient`/`queryClient`는 더 이상 `shared/stores`를 직접 import하지 않는다 (Phase 4 리팩토링으로 제거). 대신 `configureHttpRuntime({ onUnauthorized })`/`configureQueryRuntime({ onGlobalError })`로 앱이 콜백을 주입한다 — `src/app/_layout.tsx` 모듈 최상위에서 1회 호출 (컴포넌트 밖, `registerNotificationAuthCleanup()`과 같은 위치/타이밍).
- **이 호출은 첫 HTTP 요청/쿼리 에러보다 반드시 먼저 실행돼야 한다** — `_layout.tsx`가 로드되자마자(렌더 전) 동기 호출하는 이유. 새 진입점을 추가해도 이 순서를 깨지 말 것.
- 콜백 내부는 여전히 호출 시점 `getState()`를 쓴다 (`useAuthStore.getState().logout()` 등) — 모듈 초기화 순서 문제가 없는 이 관례는 유지한다.
- `ApiErrorResponse`/`ReissueTokenResponse`는 `platform/http/types.ts` 소유(Phase 5 이동 완료). `tokenRefreshService`는 더 이상 `features/auth`의 `AuthResponse`를 공유하지 않는다 — 서버 shape가 우연히 같아도 reissue 응답은 platform이 실제 쓰는 필드(`accessToken`/`refreshToken`)만 별도 타입으로 정의한다. `platform → shared` import는 이제 0이다.

## storage

- 토큰은 SecureStore, 일반 데이터는 AsyncStorage — 한 파일(`storage.ts`)에서 둘 다 노출하므로 새 키 추가 시 민감도에 맞는 쪽을 쓸 것. 구 AsyncStorage 토큰 → SecureStore 마이그레이션은 `useAppBootstrap`이 1회 수행 (auth 초기화보다 먼저 — 순서 보장 필요).
