# ADR 0002: Cross-Feature Dependency Policy

- **Status**: Accepted
- **Date**: 2026-08-20

## 문제

`feature/ai-report` 브랜치가 커지면서 feature 간 의존이 통제 없이 늘었다:

- `analysis ↔ notifications`가 서로를 참조하는 순환 의존이 생겼다 (`useAnalysisPushPrompt`가 notification 권한/토큰을 다루고, `useFCMLifecycle`이 analysis 쿼리 캐시를 직접 invalidate).
- `notifications`가 `member`의 내부 쿼리 키(`memberQueryKeys`)와 응답 shape(`GetMemberResponse`)를 직접 만지며 캐시를 patch했다.
- `analysis`가 `question`의 훅을 `@/features/question/hooks/queries/...` 경로로 직접 import했다.
- admob/answer/auth/feed/question/settings 사이에도 같은 패턴의 deep import가 22건 쌓여 있었다 (Phase 8에서 ESLint 가드를 켜고 나서야 전량 파악됨).

상대 feature의 내부 폴더 구조를 알아야 코드를 수정할 수 있는 상태였고, 두 feature가 서로 의존하면 어느 한쪽만 봐서는 전체 동작을 예측할 수 없었다.

## 결정

**1. Feature 간 읽기 의존은 상대 feature의 `public.ts`를 통한 단방향 참조만 허용한다.**

- `@/features/<name>/public`이 노출하는 것만 사용 (`export *` 금지, 이름 명시 재수출만).
- 의존 방향은 acyclic — A가 B의 `public.ts`를 쓰면 B는 A를 참조할 수 없다.
- `public.ts`는 실제 외부 consumer가 있는 feature에만 만든다 (선제적 생성 금지).

**2. 두 feature 이상을 동시에 조율하는 workflow는 어느 feature에도 두지 않고 `app/integrations`가 소유한다.**

판단 기준: A feature의 event/mutation 성공이 B feature의 cache invalidate·navigation을 유발하면, 혹은 두 feature를 동시에 import해야 하면 `app/integrations` 후보다.

**3. Feature 간 순환 의존은 금지한다.** 순환이 생기는 지점은 예외 없이 (1) `public.ts` 단방향 참조로 한쪽만 남기거나, (2) `app/integrations`로 끌어올린다.

**4. 이 규칙은 ESLint로 자동 강제한다** (`eslint.config.mjs`의 `local/no-cross-feature-deep-import`). 사람이 리뷰에서 기억해야 하는 규칙은 오래가지 못한다는 것을 이번 리팩토링 자체가 증명했다 — 애초에 이 순환·deep import들이 문서(`README.md`)의 절대 규칙을 어기며 쌓였었다.

## 결과

- `analysis ↔ notifications` 순환 제거 — `useAnalysisPushPrompt` → `app/integrations/analysis-notifications`, notification → analysis 캐시 무효화/딥링크 → `app/integrations/notifications`.
- `member`의 캐시 소유권을 `features/member/public.ts`(`snapshotMemberMe`/`patchMemberNotificationSetting`/`invalidateMemberMe` 등)로 명시화, `notifications`는 raw 쿼리 키를 더 이상 모른다.
- 전체 9개 feature에 걸쳐 존재하던 deep import 22건 + `public.ts` 부재로 못 잡던 사각지대까지 정리 (`admob`, `answer`에 `public.ts` 신규 생성).
- ESLint(`npm run lint`)가 이 정책을 커밋마다 검증한다 — 새 위반은 CI/로컬에서 즉시 드러난다.

## 향후 재고려 시점

- feature 수가 크게 늘어 `app/integrations`가 비대해지면(예: 10개 이상의 조율 workflow), integration 자체를 별도 레이어로 분리할지 재검토.
- 특정 feature 쌍의 read dependency가 너무 잦아 `public.ts`가 사실상 그 feature 전체를 재노출하게 되면, 두 feature의 경계 자체(합치거나 다시 쪼개는 것)를 재검토.
- 그 전까지는 이 세 규칙(`public.ts` 단방향 / `app/integrations` / 순환 금지)을 예외 없이 유지한다.
