# services — 인프라 계약과 함정

이 폴더는 인프라만 담는다 (비즈니스 서비스는 `features/*/services/`). 에러 처리의 계층별 역할 분담은 README §6이 진실원 — 여기엔 세부 계약만.

## apiClient 계약

- **interceptor는 정규화만 한다** — 모든 에러는 `ApiErrorResponse{traceId,status,code,message}`로 reject. 사용자 표시는 `queryClient.ts`의 cache-level onError가 담당. **interceptor에 showError를 추가하지 말 것.**
- 자동 주입 헤더: `Authorization`(SecureStore), `Accept-Language`(사용자 선택 언어 우선), **`Timezone`(기기 타임존)** — 서버의 "오늘의 질문" 날짜 판정이 이 헤더 기준이다. 날짜가 어긋나는 버그는 기기 타임존부터 확인.
- timeout 5초 (refresh 요청도 별도로 5초). 서버 메시지가 없을 때의 fallback 에러 메시지는 i18n(`common:error.*`).

## 401 / 토큰 갱신

- `tokenRefreshService.refresh()`는 Promise mutex — 동시다발 401이 와도 갱신은 1회, 나머지는 같은 Promise를 기다린다.
- refresh는 **raw axios**를 쓴다 (apiClient를 쓰면 interceptor 무한루프). `/auth/reissue-token` 요청 자체는 401 재시도 대상에서 제외.
- refresh 실패 → **조용히 로그아웃** (`useAuthStore.logout()`) — 의도된 UX 결정 (코드 NOTE 참고).
- 401은 query/mutation retry 대상이 아니다 — interceptor가 이미 refresh+재시도를 끝낸 뒤이므로 queryClient에서 재시도하면 중복 요청.

## queryClient 계약

- **`SILENT_ERROR_CODES` Set이 silent 코드의 유일한 관리 지점.** 코드를 추가하면 해당 코드의 후속 처리(refetch/dialog)는 호출측(mutation hook + 컴포넌트) 책임이 된다 — 추가만 하고 후속 처리를 안 만들면 에러가 조용히 사라진다.
- `meta: { suppressGlobalError: true }` — 백그라운드 prefetch처럼 사용자 인터랙션 없는 조회의 실패 dialog를 생략하는 용도. 남용 금지 (화면이 다시 조회하면 meta 없이 정상 표시됨).
- retry는 최종 실패 시에만 cache onError를 1회 호출 → dialog 중복 없음. 이 전제로 retry 정책을 바꿀 것.

## 알려진 의존 방향 예외

- `apiClient` → `useAuthStore`(401 시 logout 오케스트레이션)·`useLanguageStore`(Accept-Language), `queryClient` → `useApiErrorStore`(showError). services가 shared/stores를 임포트하는 **의도된 예외들**이다 — 401 로그아웃을 화면 계층으로 옮기지 말 것. store 접근은 항상 호출 시점 `getState()`라 모듈 초기화 순서 문제가 없다 — 이 관례를 유지할 것 (모듈 최상위에서 store 상태를 읽지 말 것).

## storage

- 토큰은 SecureStore, 일반 데이터는 AsyncStorage — 한 파일(`storage.ts`)에서 둘 다 노출하므로 새 키 추가 시 민감도에 맞는 쪽을 쓸 것. 구 AsyncStorage 토큰 → SecureStore 마이그레이션은 `useAppBootstrap`이 1회 수행 (auth 초기화보다 먼저 — 순서 보장 필요).
