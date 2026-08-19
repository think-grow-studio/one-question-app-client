# One Question Frontend Refactoring Roadmap

> 기준 스냅샷: `feature/ai-report` / `a1cddc08718c5ebcee9bccbd1be77ece72dd620c`
>
> 목표 아키텍처: `app + features + platform + shared`
>
> 원칙: **동작을 유지한 채 의존성을 먼저 정리하고, 파일 이동은 나중에 한다.**

---

# 0. 전체 순서

```text
Phase 0  Baseline 고정 / 회귀 방지
   ↓
Phase 1  아키텍처 규칙 문서화
   ↓
Phase 2  analysis ↔ notifications 순환 제거
   ↓
Phase 3  cross-feature public contract 도입
   ↓
Phase 4  platform reverse dependency 제거
   ↓
Phase 5  services → platform 이동
   ↓
Phase 6  shared/type ownership 정리
   ↓
Phase 7  analysis/app 내부 책임 정리
   ↓
Phase 8  자동 architecture guard 추가
   ↓
Phase 9  문서 정합성 + 최종 회귀 테스트
```

**파일 이동을 Phase 5까지 미루는 것이 핵심이다.**

먼저 dependency를 올바르게 만든 뒤 경로만 바꿔야
“대규모 import 변경 + 구조 변경 + 동작 변경”이 한 번에 섞이지 않는다.

---

# Phase 0. Baseline 고정 / 회귀 방지

## 목표

리팩토링 중 “구조는 좋아졌는데 앱 동작이 깨진 상태”를 방지한다.

## 작업

- [ ] 현재 기준 commit 기록
- [ ] `npx tsc --noEmit`
- [ ] `npm test`
- [ ] Android preview 기본 smoke test
- [ ] iOS simulator 기본 smoke test

## 반드시 확인할 흐름

### Auth

- [ ] 로그인
- [ ] 로그아웃
- [ ] 401 refresh
- [ ] refresh 실패 시 logout
- [ ] 회원 탈퇴

### Notification

- [ ] 권한 미요청
- [ ] 권한 허용
- [ ] 권한 거부
- [ ] reminder toggle
- [ ] analysis report notification toggle
- [ ] FCM token refresh
- [ ] foreground push
- [ ] background notification tap
- [ ] quit-state notification tap

### Analysis

- [ ] history load
- [ ] pagination
- [ ] answer selection
- [ ] report create
- [ ] duplicate request/idempotency
- [ ] PENDING
- [ ] COMPLETED
- [ ] FAILED
- [ ] source 화면
- [ ] ANALYSIS_DONE 수신 후 최신 결과 반영

## Exit Criteria

Baseline 동작 목록을 체크할 수 있어야 다음 단계 진행.

---

# Phase 1. 아키텍처 규칙 문서부터 확정

## 목표

코드를 옮기기 전에 “어떤 구조가 정답인지”를 먼저 고정한다.

## 추가 문서

추천:

```text
docs/ARCHITECTURE.md
docs/REFACTORING_FRONTEND_ARCHITECTURE.md
```

또는 본 문서들을 그대로 저장한다.

README에는 세부 설계를 모두 넣지 않고 핵심 규칙만 둔다.

## README에 들어갈 핵심 규칙

```text
Top-level:
app / features / platform / shared

feature → feature:
- public.ts only
- acyclic only
- workflow/side-effect integration은 app/integrations

platform:
- features/app/shared import 금지

shared:
- features/app import 금지
```

## 이 단계에서는 코드 이동 금지

문서만 고친다.

## Exit Criteria

개발자가 아래 질문에 동일하게 답할 수 있어야 한다.

- analysis에서 question data가 필요하면?
- notification 완료 event가 analysis를 갱신하면?
- member cache를 notifications가 변경해야 하면?
- Firebase SDK wrapper는 어디인가?
- 공용 Dialog는 어디인가?

---

# Phase 2. `analysis ↔ notifications` 순환 제거

## 목표

이번 리팩토링에서 가장 중요한 작업.

현재:

```text
analysis → notifications
notifications → analysis
```

를:

```text
analysis          notifications
    ↑                 ↑
    └── app/integrations ──┘
```

로 만든다.

---

## Step 2-1. Analysis Push Prompt 이동

### Current

```text
src/features/analysis/hooks/useAnalysisPushPrompt.ts
```

이 파일은 실제로:

- analysis UX
- notification setting
- OS notification permission
- FCM token registration

을 동시에 조율한다.

따라서 단일 analysis feature 소유가 아니다.

### Target

```text
src/app/integrations/analysis-notifications/useAnalysisPushPrompt.ts
```

### 변경

`app/(tabs)/analysis/select.tsx`는 integration hook을 사용한다.

```text
app route
 ├─ analysis create mutation
 └─ analysis-notification integration
```

`features/analysis`는 notifications를 더 이상 import하지 않는다.

### Exit Criteria

```bash
grep -R "features/notifications" src/features/analysis
```

결과가 0.

---

## Step 2-2. Notification → Analysis cache dependency 제거

### Current

`useFCMLifecycle.ts`가:

```text
analysisKeys
queryClient.invalidateQueries
```

를 직접 안다.

### Target

notifications는 push transport/event까지만 담당.

개념적으로:

```ts
type NotificationEvent =
  | { type: 'ANALYSIS_DONE'; analysisReportId: number }
  | { type: 'OTHER' };
```

notification feature는 event를 외부에 전달한다.

app integration이 event를 받아 analysis에 effect를 요청한다.

### 추천 위치

```text
src/app/integrations/notifications/useNotificationAppIntegration.ts
```

### Analysis 쪽 public contract 예시

```ts
// features/analysis/public.ts
export { invalidateAnalysisQueries } from './model/analysisCache';
```

app integration:

```ts
if (event.type === 'ANALYSIS_DONE') {
  invalidateAnalysisQueries(queryClient);
}
```

Raw `analysisKeys`를 외부에 공개하는 것보다
“무엇을 해달라는지”가 드러나는 helper를 선호한다.

### Exit Criteria

```bash
grep -R "features/analysis" src/features/notifications
```

결과가 0.

---

## Step 2-3. Notification Deep Link Routing 이동

### Current

notifications가 다음 route를 안다.

```text
/(tabs)/analysis/:id
/(tabs)
```

### Target

notifications:

```text
Push payload → typed event
```

app integration:

```text
typed event → Expo Router route
```

### Exit Criteria

`features/notifications` 내부에 `/(tabs)/analysis` 문자열이 없다.

---

## Step 2-4. `isAppReady` semantic bug 후보 함께 정리

현재 quit-state 처리 readiness가 `splashDone`만 기준으로 되어 있다면
실제 route tree 준비 조건과 동일하게 맞춘다.

예:

```ts
const isAppReady =
  !isLoading &&
  splashDone &&
  updateChecked;
```

이 변경은 architecture 작업과 함께 하되 별도 테스트한다.

---

# Phase 3. Cross-feature Public Contract 도입

## 목표

허용되는 feature dependency를 deep import에서 stable contract로 바꾼다.

모든 feature에 `public.ts`를 만들지 않는다.

**현재 외부 consumer가 있는 곳부터** 만든다.

---

## Step 3-1. `question/public.ts`

### Current dependency

```text
analysis/useAnswerSelection
→ question/hooks/queries/useQuestionQueries
```

### Target

```text
analysis
→ question/public.ts
```

예:

```ts
export {
  useTimeline as useQuestionTimeline,
} from './hooks/queries/useQuestionQueries';
```

analysis:

```ts
import { useQuestionTimeline } from '@/features/question/public';
```

### Exit Criteria

analysis가 `features/question/**` 내부 path를 직접 import하지 않는다.

---

## Step 3-2. `member/public.ts`

### Current dependency

notifications가 다음을 직접 안다.

```text
useMemberMe
memberQueryKeys
GetMemberResponse
NotificationSetting
```

특히 Query cache를 직접 patch하는 것이 ownership을 흐린다.

### Target

member가 자신의 cache helper를 소유한다.

예:

```text
features/member/model/memberCache.ts

patchMemberNotificationSetting(...)
invalidateMemberMe(...)
```

`member/public.ts`에서 필요한 API만 노출.

notifications:

```text
member/public.ts
```

만 import.

### Exit Criteria

notifications에:

```text
member/hooks/queries/*
shared/types/member
```

deep dependency가 없다.

---

## Step 3-3. Public Contract 규칙 확인

- [ ] `export *` 없음
- [ ] 외부에 필요 없는 내부 hook export 안 함
- [ ] type까지 필요한 경우만 export
- [ ] public contract 변경은 feature 간 API 변경으로 취급

---

# Phase 4. `platform` reverse dependency 제거

## 목표

파일 이름을 바꾸기 전에 현재 `services`가 `shared`를 역으로 참조하는 문제를 끊는다.

현재:

```text
apiClient → useAuthStore
apiClient → useLanguageStore
queryClient → useApiErrorStore
```

최종적으로 platform은 shared를 몰라야 한다.

---

## Step 4-1. HTTP Unauthorized Handler 분리

### 현재

apiClient가 refresh 실패 시 직접:

```ts
useAuthStore.getState().logout()
```

호출.

### Target

HTTP runtime callback.

예:

```ts
let onUnauthorized: (() => Promise<void>) | undefined;

export function configureHttpRuntime(config: {
  onUnauthorized: () => Promise<void>;
}) {
  onUnauthorized = config.onUnauthorized;
}
```

app bootstrap:

```ts
configureHttpRuntime({
  onUnauthorized: () => useAuthStore.getState().logout(),
});
```

apiClient는 auth store를 모른다.

### 주의

DI container나 interface hierarchy를 만들지 않는다.

callback 하나면 충분하다.

---

## Step 4-2. Locale dependency 정리

apiClient가 `useLanguageStore` 자체를 읽지 않게 한다.

권장:

```text
shared/useLanguageStore
  → platform/i18n runtime language 변경

apiClient
  → platform/i18n current language 읽기
```

즉 이미 i18n instance가 현재 언어를 알고 있으므로
store를 HTTP layer가 직접 알 필요가 없다.

---

## Step 4-3. Query Global Error Callback 분리

현재 queryClient가 `useApiErrorStore`를 직접 import.

Target:

```ts
configureQueryRuntime({
  onGlobalError: ...
});
```

app bootstrap:

```ts
configureQueryRuntime({
  onGlobalError: (error) =>
    useApiErrorStore.getState().showError(
      error.message,
      error.requestId,
    ),
});
```

---

## Step 4-4. Technical Error Type 이동

`ApiErrorResponse`는 제품 domain type이 아니라 HTTP/runtime error type이다.

Target:

```text
platform/http/types.ts
```

QueryClient도 이 type을 사용.

---

## Exit Criteria

현재 `services` 기준으로 먼저:

```bash
grep -R "@/shared" src/services
```

가 필요한 최소 type 외에는 없어지고,
최종적으로 Phase 5 이동 후에는 platform → shared import가 0이 된다.

---

# Phase 5. `services` → `platform` 물리 이동

## 목표

이제 dependency가 올바르므로 파일 경로를 실제 의미에 맞춘다.

## 이동 순서

### 5-1. Storage

```text
services/storage.ts
→ platform/storage/storage.ts
```

영향이 작고 다른 platform 코드의 기반이므로 먼저.

---

### 5-2. Firebase

```text
services/firebase/
→ platform/firebase/
```

내부 barrel contract는 유지 가능.

---

### 5-3. HTTP

```text
services/tokenRefreshService.ts
→ platform/http/tokenRefreshService.ts

services/apiClient.ts
→ platform/http/apiClient.ts
```

---

### 5-4. Query

```text
services/queryClient.ts
→ platform/query/queryClient.ts
```

---

### 5-5. Native App Utilities

```text
services/appReview.ts
→ platform/app/appReview.ts

services/appVersionService.ts
→ platform/app/appVersion.ts
```

---

## Import Alias

`tsconfig.json`:

```json
"@/platform/*": ["./src/platform/*"]
```

추가.

모든 이동 완료 후:

```text
@/services/*
```

alias 제거.

---

## Exit Criteria

- [ ] `src/services` 디렉토리 없음
- [ ] `@/services/` import 없음
- [ ] `platform → features` 없음
- [ ] `platform → shared` 없음
- [ ] typecheck/test 통과

---

# Phase 6. Shared / Type Ownership 정리

## 목표

`shared/types`가 feature domain type 창고가 되는 것을 방지한다.

한 번에 전부 옮기지 않는다.

외부 dependency가 많은 타입부터 ownership을 확정한다.

---

## Step 6-1. Member Types

현재:

```text
shared/types/member.ts
```

Target 후보:

```text
features/member/model/types.ts
```

또는 API response라면:

```text
features/member/types/api.ts
```

`NotificationSetting`을 어떤 feature가 소유할지는 서버 contract와 사용 맥락을 고려하되,
외부에는 `member/public.ts`로만 노출한다.

---

## Step 6-2. Auth Response

현재 `shared/types/auth.ts`가 platform token refresh 때문에 shared에 있다면,
refresh endpoint에 필요한 최소 response type을 platform 내부에 별도로 둔다.

예:

```ts
interface ReissueTokenResponse {
  accessToken: string;
  refreshToken: string;
}
```

로그인 feature의 `AuthResponse`와 굳이 같은 타입을 공유하지 않는다.

서버 shape가 우연히 같다는 이유로 module ownership을 섞지 않는다.

---

## Step 6-3. Analysis Types

`features/analysis/types/api.ts`에서:

- 실제 HTTP request/response
- mock-only availability
- FCM payload

를 구분한다.

최소 목표:

```text
types/api.ts       실제 HTTP 계약
model/...          client-only model
notifications/... push event parsing contract
```

---

## Exit Criteria

`shared/types`에 특정 feature 이름의 response/domain 타입이 새로 추가되지 않는다.

---

# Phase 7. Analysis / App 내부 책임 정리

## 목표

AI 리포트 브랜치에서 생긴 책임 혼합을 최소 비용으로 정리한다.

---

## Step 7-1. `domain` → `model`

대상:

```text
analysis/domain/analysisPresentation.ts
analysis/domain/analysisPagination.ts
analysis/domain/createRequestIdentity.ts
```

Target:

```text
analysis/model/
```

이유:

이 프로젝트에서 이 코드들은 DDD Domain Layer라기보다
feature-local pure model/logic이다.

---

## Step 7-2. Availability Presentation 로직 이동

현재 `app/(tabs)/analysis/index.tsx`에서:

- cooldown day 계산
- AvailabilityReason → message
- request enabled 판단

을 직접 한다.

이를 순수 함수로 분리.

예:

```text
features/analysis/model/analysisAvailabilityPresentation.ts
```

Route/screen은 결과만 렌더링.

---

## Step 7-3. `analysisApi` HTTP-only 규칙 복구

현재 availability mock이 HTTP API object 안에 섞여 있다면 분리.

Server endpoint 배포 전 임시 구조 예:

```text
analysis/api/analysisApi.ts
analysis/api/mockAnalysisAvailability.ts
```

`analysisApi`는 HTTP만 담당.

Availability query가 mock을 선택하는 것은 임시임을 명시한다.

실제 server endpoint 배포 후 mock 삭제.

---

## Step 7-4. App Bootstrap 위치 정리

app-level bootstrap hook이면:

```text
shared/hooks/useAppBootstrap.ts
→ app/bootstrap/useAppBootstrap.ts
```

후보.

`useVersionCheck`도 app-wide lifecycle이면 같은 기준 검토.

단, 이 이동은 기능 변경 없이 마지막에 한다.

---

## Exit Criteria

`app` 화면에서 중요한 business/presentation 판단이 계속 증가하지 않는다.

---

# Phase 8. 자동 Architecture Guard

## 목표

README를 사람이 기억해서 지키는 구조에서 벗어난다.

과한 architecture framework는 사용하지 않는다.

ESLint 또는 작은 script만 사용한다.

---

## 최소 검사

### 1. platform boundary

금지:

```text
platform → features
platform → shared
platform → app
```

### 2. shared boundary

금지:

```text
shared → features
shared → app
```

기존 `AppErrorBoundary → admob` 예외는 explicit allowlist.

### 3. feature deep import

다른 feature에서:

```text
@/features/question/hooks/*
```

금지.

허용:

```text
@/features/question/public
```

### 4. no-explicit-any

기존 절대 규칙을 실제 lint로 강제.

---

## 도구

가벼운 선택:

- ESLint `no-restricted-imports`
- 작은 Node dependency check script

이번 프로젝트 규모에서는 dependency-cruiser/Nx 같은 큰 도구를 굳이 도입하지 않는다.

---

# Phase 9. Error Policy / 문서 최종 정리

## 목표

구조와 문서를 다시 동일하게 만든다.

---

## Step 9-1. Silent Error Policy 재검토

현재 platform query client가:

```text
QUESTION-*
PUBLIC-QUESTION-*
```

같은 feature-specific code를 아는 구조를 제거할지 검토.

이 작업은 UX 회귀 위험이 있으므로 가장 마지막.

---

## Step 9-2. README 수정

최종 구조:

```text
app
features
platform
shared
```

와 실제 코드가 정확히 일치하도록 갱신.

---

## Step 9-3. Folder CLAUDE.md 업데이트

특히:

```text
platform/
features/notifications/
features/analysis/
```

의 불변식 수정.

---

## Step 9-4. Architecture ADR

다음 정도만 ADR 후보.

### ADR: Cross-feature Dependency Policy

기록할 결정:

```text
- stable read dependency는 public.ts를 통한 단방향 의존 허용
- cross-feature workflow는 app/integrations
- feature cycle 금지
```

이 결정은 향후 뒤집기 어렵기 때문에 ADR 가치가 있다.

---

# PR / Commit 권장 단위

한 PR에 전부 넣지 않는다.

추천 순서:

```text
PR 1
docs: define frontend architecture boundaries

PR 2
refactor: decouple analysis and notifications

PR 3
refactor: add question/member feature public contracts

PR 4
refactor: invert platform runtime dependencies

PR 5
refactor: move services into platform

PR 6
refactor: clarify shared type ownership

PR 7
refactor: clean analysis model and app composition

PR 8
chore: enforce architecture import boundaries
```

각 PR은 **동작 변화가 없거나 하나의 명확한 동작 변화만** 포함한다.

---

# 각 Phase 공통 검증

매 단계:

```bash
npx tsc --noEmit
npm test
```

그리고 영향 feature smoke test.

---

# 특히 위험한 영역

## 1. Auth / 401

`apiClient → logout` 의존을 callback으로 바꿀 때:

- 동시 401 mutex 유지
- refresh 1회 보장
- 실패 시 logout 1회
- logout cleanup 순서 유지

반드시 검증.

---

## 2. Notification Token

리팩토링 중에도 다음 invariant 유지:

```text
store fcmToken
= 서버 등록에 성공한 token
```

token registration / reconciliation logic을 구조 변경 이유로 “단순화”하지 않는다.

---

## 3. Notification Setting PUT

현재 전체 교체 PUT이면
필드를 일부만 보내는 형태로 바꾸지 않는다.

architecture 변경과 API behavior 변경을 섞지 않는다.

---

## 4. Analysis Idempotency

`useCreateAnalysis`의 key reuse 정책을 유지한다.

구조 변경 중 mutation wrapper를 일반적인 `mutateAsync`로 바꾸면서
idempotency key 생성 위치를 실수로 mutationFn 내부로 옮기지 않는다.

---

## 5. Question Cache

analysis answer selection을 public contract로 바꾸더라도
question timeline cache topology 자체는 건드리지 않는다.

이번 architecture migration과 query cache redesign은 별개다.

---

# 작업 중 판단 규칙

파일 하나를 이동할지 고민되면 다음 순서로 판단한다.

## Q1. 기술 때문에 존재하는 코드인가?

Yes:

```text
platform
```

## Q2. 특정 제품 기능 때문에 존재하는가?

Yes:

```text
features/<owner>
```

## Q3. 2개 이상 feature가 쓰는 제품 무관 UI/utility인가?

Yes:

```text
shared
```

## Q4. 둘 이상의 feature를 연결하는 workflow인가?

Yes:

```text
app/integrations
```

## Q5. Expo Router route인가?

Yes:

```text
app
```

---

# Stop Condition — 여기서 더 추상화하지 않는다

다음 상태가 되면 architecture migration을 종료한다.

```text
- feature cycle 없음
- cross-feature deep import 없음
- services 없음
- platform reverse dependency 없음
- app integration 위치 명확
- README와 코드 일치
- import rule 자동 검사
```

여기까지 왔는데도 다음을 추가하려는 경우:

```text
Repository
UseCase class
Port
Adapter interface
Domain service
Aggregate
```

**실제 필요 사례가 먼저 있는지 확인한다.**

없으면 만들지 않는다.

---

# 최종 목표 개발 경험

개발자가 요구사항을 받았을 때:

```text
AI 리포트 자체 수정
→ features/analysis

오늘의 질문/답변 데이터
→ features/question

푸시 권한/FCM token
→ features/notifications

분석 완료 Push와 분석 화면 연결
→ app/integrations

Axios / token refresh
→ platform/http

QueryClient global runtime
→ platform/query

공용 UI
→ shared/ui
```

를 파일 탐색 전에 예측할 수 있으면 완료다.
