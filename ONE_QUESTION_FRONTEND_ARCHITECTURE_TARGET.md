# One Question Frontend Architecture Target

> 기준 스냅샷: `feature/ai-report` / `a1cddc08718c5ebcee9bccbd1be77ece72dd620c`
>
> 목적: **기존 feature-first 구조의 장점을 유지하면서, feature 간 순환 의존·deep import·`services`/`shared`의 책임 혼재만 제거한다.**
>
> 이 문서는 풀 FSD, 풀 DDD, Clean Architecture 전체 도입을 목표로 하지 않는다.

---

## 0. 결론

One Question 프론트엔드는 다음 네 영역을 기준으로 한다.

```text
src/
├─ app/          # Expo Router + Provider + Bootstrap + Cross-feature Integration
├─ features/     # 제품 기능 단위 vertical slice
├─ platform/     # HTTP / Query / Storage / Firebase 등 기술 인프라
└─ shared/       # 제품 도메인을 모르는 공용 UI / theme / utility / app-wide state
```

핵심 원칙은 폴더 개수가 아니라 아래 4개다.

1. **feature는 자신의 내부 구현을 소유한다.**
2. **다른 feature를 사용할 때는 그 feature의 public contract만 사용한다.**
3. **feature 간 순환 의존은 금지한다.**
4. **여러 feature를 동시에 조율하는 workflow는 `app/integrations`가 소유한다.**

---

# 1. 이 아키텍처가 해결하려는 현재 문제

현재 구조에는 좋은 부분이 많다.

- feature-first 구조가 이미 존재한다.
- TanStack Query와 Zustand의 역할이 대체로 분리되어 있다.
- `question` 캐시 정책, notification reconciliation, analysis idempotency 등 복잡한 불변식이 문서화되어 있다.
- `app/`과 `features/`를 구분하려는 방향이 이미 존재한다.

다만 기능이 커지며 다음 경계가 애매해졌다.

```text
analysis → notifications
notifications → analysis

analysis → question 내부 hook
notifications → member 내부 query/cache

shared → services
services → shared
```

특히 문제는 “의존이 존재한다” 자체보다 다음이다.

- 상대 feature의 내부 폴더 구조를 알아야 한다.
- 두 feature가 서로 의존하기 시작했다.
- `services`가 인프라뿐 아니라 auth/logout/error UX 정책을 안다.
- 루트 README의 절대 의존 규칙과 실제 코드가 다르다.

이 리팩토링은 이 문제들만 해결한다.

---

# 2. 하지 않는 것 — Overengineering 방지 규칙

다음은 이번 아키텍처의 **명시적 비목표**다.

## 하지 않는다

```text
domain/
application/
infrastructure/
presentation/
repositories/
ports/
adapters/
factories/
domain-services/
```

를 모든 feature에 강제하지 않는다.

또한 다음을 하지 않는다.

- 프론트에서 백엔드 DDD 모델을 복제하지 않는다.
- 모든 API DTO를 별도의 Domain Entity로 변환하지 않는다.
- 모든 동작에 `UseCase` 클래스를 만들지 않는다.
- 모든 feature에 Repository 인터페이스를 만들지 않는다.
- `features`를 `modules`로 이름만 바꾸지 않는다.
- `analysis`를 지금 당장 `analysis-report`로 전체 rename하지 않는다.
- 기존 코드를 한 번에 전부 이동하지 않는다.
- 사용처가 하나뿐인 코드를 “언젠가 공용일 것 같아서” shared로 올리지 않는다.

## 추상화 생성 기준

새 abstraction은 아래 중 하나가 실제로 발생할 때만 만든다.

1. 동일한 정책을 2곳 이상에서 사용한다.
2. feature 간 의존을 끊기 위해 안정적인 contract가 필요하다.
3. 테스트하려는 순수 로직이 React/SDK와 강하게 결합되어 있다.
4. 구현체 교체가 실제 요구사항이다.

그 외에는 함수와 hook으로 충분하다.

---

# 3. Target Directory Structure

```text
src/
├─ app/
│  ├─ _layout.tsx
│  ├─ (auth)/
│  ├─ (tabs)/
│  ├─ answer/
│  ├─ feed/
│  │
│  ├─ bootstrap/
│  │  ├─ useAppBootstrap.ts
│  │  └─ useVersionCheck.ts
│  │
│  └─ integrations/
│     ├─ notifications/
│     │  ├─ useNotificationAppIntegration.ts
│     │  └─ notificationRouting.ts
│     └─ analysis-notifications/
│        └─ useAnalysisPushPrompt.ts
│
├─ features/
│  ├─ analysis/
│  │  ├─ api/
│  │  ├─ model/
│  │  ├─ hooks/
│  │  ├─ components/
│  │  ├─ constants/
│  │  ├─ types/
│  │  └─ public.ts          # 외부 consumer가 생긴 경우에만
│  │
│  ├─ question/
│  ├─ notifications/
│  ├─ member/
│  ├─ auth/
│  ├─ feed/
│  ├─ answer/
│  ├─ settings/
│  └─ admob/
│
├─ platform/
│  ├─ http/
│  │  ├─ apiClient.ts
│  │  ├─ tokenRefreshService.ts
│  │  └─ types.ts
│  ├─ query/
│  │  └─ queryClient.ts
│  ├─ storage/
│  │  └─ storage.ts
│  ├─ firebase/
│  ├─ i18n/
│  └─ app/
│     ├─ appReview.ts
│     └─ appVersion.ts
│
└─ shared/
   ├─ ui/
   ├─ layout/
   ├─ theme/
   ├─ icons/
   ├─ utils/
   ├─ error/
   ├─ hooks/
   └─ stores/
```

`shared/stores`의 auth/language/apiError 같은 app-wide store는 이번 리팩토링에서는 유지한다.

이들을 별도 `core/`로 분리하는 것은 현재 규모에서는 이득보다 이동 비용이 크므로 범위에서 제외한다.

---

# 4. Top-level Responsibility

## `app/`

**앱을 조립한다.**

허용:

- Expo Router route 정의
- Provider 조립
- bootstrap
- 인증 redirect
- 여러 feature를 동시에 사용하는 workflow
- notification event → 특정 feature effect 연결
- route navigation

금지:

- HTTP endpoint 직접 호출
- feature 내부 cache 구현 직접 조작
- 재사용 가능한 business/presentation 규칙 축적

### Cross-feature integration의 정의

아래 조건 중 하나면 `app/integrations` 후보이다.

- A feature와 B feature를 동시에 import한다.
- notification event가 다른 feature의 state를 갱신한다.
- 한 workflow에서 서로 다른 feature의 side effect를 순서대로 실행한다.
- 양쪽 feature 중 어느 한쪽에 넣으면 역방향 의존이 생긴다.

예:

```text
ANALYSIS_DONE Push
   ↓
app/integrations
   ├─ analysis cache refresh
   └─ analysis route navigation
```

---

## `features/`

**사용자가 인식할 수 있는 제품 capability를 소유한다.**

현재 feature 구분은 우선 유지한다.

```text
question
analysis
notifications
member
auth
feed
answer
settings
admob
```

이번 리팩토링에서는 feature 분류 자체를 대수술하지 않는다.

### Feature 내부 기본 구조

모든 폴더를 강제하지 않는다.

```text
features/<feature>/
├─ api/          # 해당 feature 서버 API
├─ model/        # 순수 로직 / presentation model / cache helper
├─ hooks/        # React Query / orchestration hook
├─ components/   # feature UI
├─ stores/       # feature-local Zustand
├─ services/     # feature 전용 SDK/business service가 실제로 필요할 때만
├─ constants/
├─ types/
└─ public.ts     # 외부 feature consumer가 있을 때만
```

### `model/`의 의미

DDD Domain Layer가 아니다.

다음처럼 React/SDK에 직접 의존하지 않는 feature 로직의 기본 위치다.

- pagination 계산
- presentation state 계산
- selection rule
- request identity/idempotency helper
- cache patch helper
- DTO → 화면 model 변환이 필요한 경우의 mapper

예:

```text
analysis/domain/analysisPresentation.ts
analysis/domain/analysisPagination.ts
analysis/domain/createRequestIdentity.ts
```

는 장기적으로 다음이 더 자연스럽다.

```text
analysis/model/
```

---

## `platform/`

**기술 때문에 존재하는 코드**만 둔다.

예:

- Axios
- React Query global client
- SecureStore / AsyncStorage abstraction
- Firebase SDK wrapper
- Crashlytics
- analytics
- i18n runtime
- app version/review native API

### 중요한 절대 규칙

```text
platform → features   금지
platform → app        금지
platform → shared     최종적으로 금지
```

`platform`은 제품 feature를 알아서는 안 된다.

현재 `apiClient → useAuthStore/useLanguageStore`,
`queryClient → useApiErrorStore` 같은 의존은 migration 대상이다.

단, 이를 해결하기 위해 거대한 DI framework를 도입하지 않는다.

**작은 callback/configuration seam**만 사용한다.

예:

```ts
configureHttpRuntime({
  onUnauthorized: () => useAuthStore.getState().logout(),
});

configureQueryRuntime({
  onGlobalError: (error) =>
    useApiErrorStore.getState().showError(error.message, error.requestId),
});
```

configuration 호출은 `app/bootstrap`에서 한다.

---

## `shared/`

**특정 제품 feature를 몰라도 의미가 있는 코드**만 둔다.

적합:

- Button
- Text
- AlertDialog
- Screen
- theme
- icon
- responsive utility
- generic error UI
- app-wide auth/language/theme/apiError store

부적합:

- `AnalysisReport`
- `NotificationSetting`
- `MemberResponse`
- `QuestionStatus`
- 특정 feature의 API DTO

### shared의 의존 방향

```text
shared → platform   허용
shared → features   금지
shared → app        금지
```

현재 `AppErrorBoundary → features/admob` 예외는 기존 제품 결정으로 유지하되,
새 예외를 추가하지 않는다.

---

# 5. Feature-to-Feature Dependency Rule

feature 간 import를 완전히 금지하지 않는다.

대신 **두 종류로 나눈다.**

## A. 안정적인 단방향 read dependency — 허용

예:

```text
analysis → question
notifications → member
```

조건:

1. 상대 feature의 `public.ts`만 import한다.
2. dependency graph가 순환하지 않는다.
3. 상대 feature의 query key/cache representation을 직접 수정하지 않는다.
4. 가능한 한 read contract 또는 명시적인 helper만 사용한다.

예:

```ts
// 금지
import { useTimeline }
  from '@/features/question/hooks/queries/useQuestionQueries';

// 허용
import { useQuestionTimeline }
  from '@/features/question/public';
```

`public.ts`는 모든 것을 재수출하지 않는다.

```ts
export { useTimeline as useQuestionTimeline } from './hooks/queries/useQuestionQueries';
export type { DailyQuestionDomain } from './model/types';
```

처럼 외부에 필요한 최소 contract만 노출한다.

---

## B. Cross-feature workflow / side effect — feature끼리 직접 연결 금지

다음은 `app/integrations`에서 처리한다.

- A의 event가 B의 cache를 invalidate
- A의 완료가 B로 navigation
- A와 B의 mutation을 한 흐름에서 조합
- 서로 의존하면 cycle이 되는 경우

현재 대표 사례:

```text
analysis → notifications
notifications → analysis
```

이 관계는 최종적으로 다음으로 바꾼다.

```text
analysis          notifications
    ↑                 ↑
    └──── app/integrations ────┘
```

---

# 6. Public Contract Rule

`public.ts`는 **외부 consumer가 존재하는 feature에만** 만든다.

목적은 barrel 편의성이 아니다.

목적은:

> 외부가 이 feature의 어느 부분까지 의존해도 되는지 명시하는 것

이다.

금지:

```ts
export * from './...';
```

허용:

```ts
export { useMemberMe } from './hooks/queries/useMemberQueries';
export { patchMemberNotificationSetting } from './model/memberCache';
export type { NotificationSetting } from './model/types';
```

Feature 내부 코드는 `public.ts`를 거치지 않아도 된다.

---

# 7. Current Cross-feature Dependencies — Target

## 7.1 analysis ↔ notifications

### 현재

```text
analysis/useAnalysisPushPrompt
    → notification permission
    → push token
    → notification setting

notifications/useFCMLifecycle
    → analysisKeys.invalidate
```

### 목표

`useAnalysisPushPrompt`는 두 feature의 workflow이므로:

```text
app/integrations/analysis-notifications/useAnalysisPushPrompt.ts
```

로 이동한다.

notification lifecycle은 notification transport 책임만 가진다.

```text
notifications
  - token refresh
  - Android foreground display
  - channel selection
  - push event parsing/emission
```

analysis 반응은 app integration이 담당한다.

```text
app/integrations/notifications
  ANALYSIS_DONE
     ↓
  analysis public cache refresh contract
     ↓
  optional navigation
```

결과:

```text
analysis X→ notifications
notifications X→ analysis
```

---

## 7.2 analysis → question

완전히 제거할 필요는 없다.

Analysis가 사용자의 기존 답변을 읽어야 하므로 자연스러운 단방향 dependency이다.

다만 내부 hook deep import를 없앤다.

```text
question/public.ts
    ↓
analysis
```

Question 내부 폴더 구조를 바꿔도 analysis가 깨지지 않는 것이 목표다.

---

## 7.3 notifications → member

Notification setting이 현재 member API 응답에 포함되어 있으므로
notifications가 member data를 읽는 것은 허용한다.

하지만 다음은 금지한다.

```text
notifications
  → memberQueryKeys
  → GetMemberResponse 전체 shape
  → 직접 setQueryData
```

Member 쪽이 cache ownership을 가진다.

예:

```text
features/member/model/memberCache.ts
features/member/public.ts
```

에서 다음과 같은 최소 contract를 노출한다.

```ts
patchMemberNotificationSetting(queryClient, nextSetting)
invalidateMemberMe(queryClient)
```

notifications는 이 helper만 사용한다.

---

# 8. `services` → `platform`

최종적으로 `src/services`는 제거한다.

매핑:

| Current | Target |
|---|---|
| `services/apiClient.ts` | `platform/http/apiClient.ts` |
| `services/tokenRefreshService.ts` | `platform/http/tokenRefreshService.ts` |
| `services/queryClient.ts` | `platform/query/queryClient.ts` |
| `services/storage.ts` | `platform/storage/storage.ts` |
| `services/firebase/` | `platform/firebase/` |
| `services/appReview.ts` | `platform/app/appReview.ts` |
| `services/appVersionService.ts` | `platform/app/appVersion.ts` |

단순 파일 이동 전에 **reverse dependency를 먼저 제거한다.**

특히:

```text
apiClient → shared auth/language store
queryClient → shared apiError store
```

를 먼저 callback configuration으로 끊는다.

그 다음 물리적으로 이동한다.

---

# 9. Error Handling Architecture

현재 global error handling 정책 자체는 유지한다.

```text
Axios
  ↓ normalize
React Query global cache error
  ↓
GlobalErrorHandler
```

변경하는 것은 ownership뿐이다.

## Target

```text
platform/http
  ApiErrorResponse 정의 + normalize

platform/query
  retry policy + callback 실행

app/bootstrap
  platform query error callback
      ↓
shared/useApiErrorStore

shared/error
  AlertDialog rendering
```

`platform/query` 안의 feature-specific silent code 목록은 장기적으로 제거한다.

현재:

```text
QUESTION-004
PUBLIC-QUESTION-003
PUBLIC-QUESTION-004
PUBLIC-QUESTION-005
```

처럼 feature error code를 platform이 아는 구조는 경계를 흐린다.

최종 목표는 query/mutation 단위의:

```ts
meta: {
  suppressGlobalError: true
}
```

또는 feature가 소유하는 explicit error policy이다.

단, 이 변경은 회귀 위험이 있으므로 마지막 단계에서 수행한다.

---

# 10. Navigation Ownership

Expo Router route 정의와 실제 navigation 결정은 `app`이 최종 소유한다.

Feature component는 필요한 경우 callback을 받는다.

```tsx
<ResultContent
  onShowSources={...}
/>
```

처럼 유지한다.

Notification feature가 직접 다음 경로를 알지 않도록 한다.

```text
/(tabs)/analysis/:id
```

Push data parsing은 notifications가 할 수 있지만,
그 결과를 어느 route로 보낼지는 `app/integrations`가 결정한다.

---

# 11. State Ownership

## Server State

TanStack Query.

- 서버 응답을 Zustand에 복제하지 않는다.
- query key와 cache helper는 해당 feature가 소유한다.
- 다른 feature가 query key를 직접 만지지 않는다.

## Client State

Zustand 또는 local React state.

- 단일 feature → feature store
- app-wide state → `shared/stores`
- 민감 토큰 → `platform/storage`

현재 `useNotificationStore.analysisReportEnabled` 같은
서버 미지원 fallback은 임시 예외로 유지한다.

---

# 12. Analysis Feature Target

최종적으로 `analysis`는 다음 느낌을 목표로 한다.

```text
features/analysis/
├─ api/
│  ├─ analysisApi.ts
│  └─ mockAnalysisAvailability.ts   # 임시, 실제 endpoint 배포 후 삭제
│
├─ model/
│  ├─ analysisPresentation.ts
│  ├─ analysisPagination.ts
│  ├─ createRequestIdentity.ts
│  └─ answerSelection.ts            # 순수 selection rule이 분리될 경우
│
├─ hooks/
│  ├─ queries/
│  ├─ mutations/
│  └─ useAnswerSelection.ts
│
├─ components/
├─ constants/
├─ types/
│  ├─ api.ts
│  └─ model.ts                      # 실제 필요할 때만
│
└─ public.ts                        # notifications/app integration에 필요한 최소 contract
```

FCM payload type은 analysis API DTO와 분리한다.

---

# 13. Architecture Dependency Matrix

최종 허용 관계:

| From | app | features | platform | shared |
|---|---:|---:|---:|---:|
| `app` | ✅ | ✅ | ✅ | ✅ |
| `features` | ❌ | ⚠️ public only / acyclic | ✅ | ✅ |
| `platform` | ❌ | ❌ | ✅ | ❌ |
| `shared` | ❌ | ❌ | ✅ | ✅ |

`features → features`의 ⚠️ 조건:

- `public.ts`만 사용
- 단방향
- cycle 금지
- side-effect orchestration이면 app으로 이동

---

# 14. Architecture Smell Checklist

새 코드를 작성할 때 아래 질문으로 판단한다.

### 다른 feature를 import하려 한다

- 상대 feature 내부 경로인가?
  - Yes → `public.ts` contract가 필요한지 검토.
- 상대 feature가 이미 나를 import하는가?
  - Yes → cycle. `app/integrations`로 이동.
- 단순 데이터 읽기인가?
  - Yes → public read contract 가능.
- 두 feature의 side effect를 연결하는가?
  - Yes → app integration.

### shared에 넣으려 한다

- 특정 제품 feature 이름이 타입/함수에 포함되는가?
  - Yes → 해당 feature에 둔다.
- 실제 2개 이상의 독립 feature가 사용하고 있는가?
  - No → 아직 shared로 올리지 않는다.

### platform에 넣으려 한다

- 이 코드가 Axios/Firebase/Storage/OS API 같은 기술 때문에 존재하는가?
  - Yes → platform 후보.
- `Question`, `Analysis`, `Member` 같은 제품 용어를 알아야 하는가?
  - Yes → platform이 아니다.

---

# 15. Definition of Done

리팩토링 완료 후 다음을 만족해야 한다.

- [ ] `analysis ↔ notifications` 양방향 dependency가 없다.
- [ ] cross-feature import는 상대 feature의 `public.ts`로 제한된다.
- [ ] feature 간 dependency graph에 cycle이 없다.
- [ ] `src/services`가 없다.
- [ ] `platform`은 `app/features/shared`를 import하지 않는다.
- [ ] app integration이 notification → analysis effect/navigation을 소유한다.
- [ ] 다른 feature가 member query key를 직접 수정하지 않는다.
- [ ] `analysis/domain`의 presentation/helper 성격 코드는 `model`로 정리된다.
- [ ] README와 실제 dependency graph가 동일하다.
- [ ] architecture 규칙을 lint/static check로 최소한 일부 자동 검증한다.
- [ ] 기존 notification, auth, query cache, analysis 생성 동작이 유지된다.

---

# 16. 최종 판단 기준

좋은 구조인지 판단하는 질문은 하나다.

> **“이 기능을 수정하려면 어느 폴더를 봐야 하는가?”를 파일을 열기 전에 예측할 수 있는가?**

예:

```text
AI 리포트 화면/정책
→ features/analysis

FCM token/권한/표시
→ features/notifications

ANALYSIS_DONE 알림을 받고 리포트 갱신/이동
→ app/integrations

Axios/401 refresh
→ platform/http

공용 Button/Dialog/theme
→ shared
```

이 예측이 유지되면 이 아키텍처의 목적을 달성한 것이다.
