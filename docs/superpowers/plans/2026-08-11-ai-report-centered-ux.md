# AI Report-Centered UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 리포트 탭을 생성 카드 중심 랜딩에서 생성 진입점과 전체 리포트 목록이 공존하는 리포트 홈으로 바꾸고, 리포트 종류 선택을 별도 생성 흐름으로 분리한다.

**Architecture:** `app/` 화면은 analysis feature의 쿼리·컴포넌트를 조립만 한다. 목록 정렬은 순수 도메인 함수로 분리하고 생성 진입 카드·목록 행·종류 카드는 각각 feature 컴포넌트로 둔다. 조회 API는 현재 mock 계약을 유지하며, 답변 스냅샷 Source API와 `사용한 답변` 화면은 서버 계약을 받은 뒤 별도 계획으로 구현한다.

**Tech Stack:** React Native 0.83, Expo Router, TypeScript strict, Tamagui, FlashList v2, TanStack Query v5, Reanimated v4, i18next, Jest (`jest-expo/ios`)

## Global Constraints

- 의존 방향 `app → features → shared → services`를 지킨다.
- `src/app/`은 화면 조립과 라우팅만 담당하며 API를 직접 호출하지 않는다.
- 서버 데이터는 TanStack Query만 사용하고 Zustand에 저장하지 않는다.
- 사용자 노출 문자열은 analysis ko/en locale에 둔다.
- 새 UI 라이브러리·폰트·아이콘 패키지를 추가하지 않는다.
- 화면은 `useScreenBackground()`, 카드는 `theme.surface`를 사용한다.
- 애니메이션은 Reanimated만 사용한다.
- FlashList v2에는 `keyExtractor`를 제공하고 `estimatedItemSize`를 넘기지 않는다.
- inline style을 새로 만들지 않는다.
- 현재 연차만 사용하고 연차 선택 UI를 추가하지 않는다.
- Source API 타입·쿼리·라우트는 서버 스펙 전에는 만들지 않는다.
- 완료 선언 전 Android → iOS 순으로 360–420dp, 라이트·다크 모드를 확인한다.

## File Map

**Create:**

- `src/features/analysis/domain/reportListOrder.ts` — 진행 우선·최신순 정렬
- `src/features/analysis/domain/__tests__/reportListOrder.test.ts` — 정렬 규칙 테스트
- `src/features/analysis/components/ReportCreateCard.tsx` — 홈 생성 진입점
- `src/features/analysis/components/ReportListRow.tsx` — 리포트 목록 행
- `src/features/analysis/components/AnalysisTypeCard.tsx` — 간단한 종류 카드
- `src/app/(tabs)/analysis/create.tsx` — 종류 선택 화면

**Modify:**

- `src/features/analysis/types/api.ts`
- `src/features/analysis/api/mockAnalysis.ts`
- `src/features/analysis/hooks/queries/useAnalysisQueries.ts`
- `src/app/(tabs)/analysis/index.tsx`
- `src/app/(tabs)/analysis/history.tsx`
- `src/app/(tabs)/analysis/_layout.tsx`
- `src/app/(tabs)/analysis/select.tsx`
- `src/features/analysis/constants/analysisTypes.ts`
- `src/locales/ko/analysis.json`
- `src/locales/en/analysis.json`
- `README.md`

**Verify unchanged:** `src/features/analysis/components/AnalysisTypeSheet.tsx`, `src/app/(tabs)/analysis/[id].tsx`, `src/features/analysis/components/ResultContent.tsx`.

**Remove after import verification:**

- `src/features/analysis/components/AnalysisBigCard.tsx`
- `src/features/analysis/components/HistoryRow.tsx`

**Deferred until Source API contract:** source route, request/response types, API method, query hook, mock payload, result-header `답변 N개 ›` 링크. 연결되지 않는 버튼이나 임시 타입은 이번 변경에 넣지 않는다.

---

### Task 1: Report List Contract and Ordering

**Files:**
- Create: `src/features/analysis/domain/reportListOrder.ts`
- Create: `src/features/analysis/domain/__tests__/reportListOrder.test.ts`
- Modify: `src/features/analysis/types/api.ts`
- Modify: `src/features/analysis/api/mockAnalysis.ts`

**Interfaces:**
- Consumes: `AnalysisHistoryItemDto`, `isAnalysisInProgress(status)`
- Produces: `orderAnalysisReports(items: readonly AnalysisHistoryItemDto[]): AnalysisHistoryItemDto[]`
- Produces: `AnalysisHistoryItemDto.answerCount: number`

- [ ] **Step 1: Write the failing ordering tests**

```ts
import { orderAnalysisReports } from '../reportListOrder';
import type { AnalysisHistoryItemDto } from '../../types/api';

function report(id: number, status: AnalysisHistoryItemDto['status'], createdAt: string): AnalysisHistoryItemDto {
  return { id, type: 'THINKING_PATTERN', status, createdAt, answerCount: 12 };
}

describe('orderAnalysisReports', () => {
  it('진행 중 리포트를 완료 리포트보다 먼저 둔다', () => {
    const ready = report(1, 'READY', '2026-08-10T00:00:00.000Z');
    const pending = report(2, 'PENDING', '2026-08-01T00:00:00.000Z');
    expect(orderAnalysisReports([ready, pending]).map((item) => item.id)).toEqual([2, 1]);
  });

  it('같은 상태 그룹은 최신 생성순이고 입력을 변경하지 않는다', () => {
    const input = [
      report(1, 'READY', '2026-08-01T00:00:00.000Z'),
      report(2, 'READY', '2026-08-10T00:00:00.000Z'),
    ];
    expect(orderAnalysisReports(input).map((item) => item.id)).toEqual([2, 1]);
    expect(input.map((item) => item.id)).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: Verify RED**

Run `npm test -- --runInBand src/features/analysis/domain/__tests__/reportListOrder.test.ts`.

Expected: FAIL because `../reportListOrder` does not exist.

- [ ] **Step 3: Add answer count to the history contract and mock**

```ts
export interface AnalysisHistoryItemDto {
  id: number;
  type: AnalysisType;
  status: AnalysisStatus;
  answerCount: number;
  createdAt: string;
}
```

Add `answerCount: r.answerCount` to `mockAnalysisApi.getHistory()` item mapping. Do not change real endpoint paths.

- [ ] **Step 4: Implement the ordering function**

```ts
import { isAnalysisInProgress } from './analysisStatus';
import type { AnalysisHistoryItemDto } from '../types/api';

export function orderAnalysisReports(items: readonly AnalysisHistoryItemDto[]): AnalysisHistoryItemDto[] {
  return [...items].sort((left, right) => {
    const progressDelta = Number(isAnalysisInProgress(right.status)) - Number(isAnalysisInProgress(left.status));
    if (progressDelta !== 0) return progressDelta;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}
```

- [ ] **Step 5: Verify GREEN**

```bash
npm test -- --runInBand src/features/analysis/domain/__tests__
```

Expected: all analysis domain tests pass.

- [ ] **Step 6: Commit the contract and ordering rule**

```bash
git add src/features/analysis/types/api.ts src/features/analysis/api/mockAnalysis.ts src/features/analysis/domain/reportListOrder.ts src/features/analysis/domain/__tests__/reportListOrder.test.ts
git commit -m "feat(analysis): order report history for the home screen"
```

---

### Task 2: Reusable Report Home Components

**Files:**
- Create: `src/features/analysis/components/ReportCreateCard.tsx`
- Create: `src/features/analysis/components/ReportListRow.tsx`
- Modify: `src/locales/ko/analysis.json`
- Modify: `src/locales/en/analysis.json`

**Interfaces:**
- Produces: `ReportCreateCard({ enabled, statusMessage, onPress })`
- Produces: `ReportListRow({ item, onPress })`

- [ ] **Step 1: Add exact home and list copy**

Merge these Korean keys into the existing locale objects:

```json
{
  "landing": {
    "subtitle": "쌓아온 답변에서 지금의 나를 발견해 보세요.",
    "createTitle": "새 리포트 만들기",
    "createDescription": "답변을 골라 새로운 분석을 시작해요",
    "reportsTitle": "나의 리포트",
    "sortLabel": "최근 생성순",
    "emptyTitle": "아직 만든 리포트가 없어요",
    "emptyMessage": "첫 리포트에서 쌓아온 답변을 만나보세요.",
    "loadError": "리포트를 불러오지 못했어요.",
    "retry": "다시 불러오기"
  },
  "list": {
    "answerCount": "답변 {{count}}개",
    "processing": "분석하고 있어요",
    "processingHint": "완료되면 알려드릴게요",
    "failed": "분석하지 못했어요"
  }
}
```

Add equivalent English copy: `Create a new report`, `My reports`, `Newest first`, `No reports yet`, `{{count}} answers`, `Analyzing`, `We'll let you know when it's ready`, and `Analysis failed`.

- [ ] **Step 2: Implement the create entry card**

```ts
interface ReportCreateCardProps {
  enabled: boolean;
  statusMessage?: string;
  onPress: () => void;
}
```

Render one full-card `Pressable` containing title, description, and optional status. Use `theme.surface`, `theme.borderColor`, `useAccentColors().primary`, `sp()`, and `radius()`. Do not use a gradient or hard-coded hex. Set button role and disabled accessibility state.

- [ ] **Step 3: Implement the list row**

```ts
interface ReportListRowProps {
  item: AnalysisHistoryItemDto;
  onPress: () => void;
}
```

Show character image, localized type name, localized date, and answer count. For `PENDING`/`PROCESSING`, show both processing strings; for `FAILED`, show failure text. Add a narrow type-palette marker but retain character and text so color is not the only identifier.

Format the date with the active i18n language, not a hard-coded `M/D` string:

```ts
const locale = i18n.resolvedLanguage ?? i18n.language;
const dateLabel = new Intl.DateTimeFormat(locale, {
  month: 'short',
  day: 'numeric',
}).format(new Date(item.createdAt));
```

- [ ] **Step 4: Type-check the components**

```bash
npx tsc --noEmit
```

Expected: TypeScript exits with code 0.

- [ ] **Step 5: Commit the home components**

```bash
git add src/features/analysis/components/ReportCreateCard.tsx src/features/analysis/components/ReportListRow.tsx src/locales/ko/analysis.json src/locales/en/analysis.json
git commit -m "feat(analysis): add report home cards"
```

---

### Task 3: Report-Centered Home and History Compatibility

**Files:**
- Modify: `src/app/(tabs)/analysis/index.tsx`
- Modify: `src/app/(tabs)/analysis/history.tsx`
- Modify: `src/features/analysis/hooks/queries/useAnalysisQueries.ts`
- Remove: `src/features/analysis/components/HistoryRow.tsx`

**Interfaces:**
- Consumes: availability/history hooks, `orderAnalysisReports`, new home components
- Produces: list-centered analysis tab home
- Preserves: `/(tabs)/analysis/history` as a redirect

- [ ] **Step 1: Replace the landing ScrollView with FlashList**

```ts
const orderedItems = useMemo(() => orderAnalysisReports(historyItems), [historyItems]);

const renderItem = useCallback(
  ({ item }: { item: AnalysisHistoryItemDto }) => (
    <ReportListRow item={item} onPress={() => router.push(`/(tabs)/analysis/${item.id}`)} />
  ),
  [router],
);
```

Use `keyExtractor={(item) => String(item.id)}`, guarded `onEndReached`, and no `estimatedItemSize`. Put title, subtitle, availability, create card, and `나의 리포트` heading in `ListHeaderComponent`.

- [ ] **Step 2: Derive create availability without changing the API**

```ts
const statusMessage =
  reason === 'INSUFFICIENT_ANSWERS'
    ? t('status.locked.progress', {
        current: availability?.answerCount ?? 0,
        required: availability?.requiredCount ?? 10,
      })
    : reason === 'COOLDOWN'
      ? t('status.cooldown.message', { days: cooldownDays })
      : reason === 'PROCESSING'
        ? t('list.processingHint')
        : undefined;
```

Set `enabled={canRequest}` and send enabled presses to `/(tabs)/analysis/create`. Keep locked/cooldown explanation near the card. Do not render a duplicate processing card when the processing report is already in the list.

- [ ] **Step 3: Add all list states**

- Loading: keep header/create entry and render three surface skeleton rows.
- Empty: show `landing.emptyTitle` and `landing.emptyMessage` below the section heading.
- Error: show `landing.loadError` and `landing.retry`; call the history query's `refetch()`.
- Pagination: preserve `hasNextPage`, `isFetchingNextPage`, and `fetchNextPage` guards from old history.

Because the screen owns an inline retry state, add `meta: { suppressGlobalError: true }` to the history query options only. Availability and detail queries retain their existing global error behavior.

- [ ] **Step 4: Redirect the old history route**

```tsx
import { Redirect } from 'expo-router';

export default function AnalysisHistoryRedirect() {
  return <Redirect href="/(tabs)/analysis" />;
}
```

Run `rg -n "analysis/history" src` and remove active internal pushes to that path.

- [ ] **Step 5: Remove obsolete HistoryRow safely**

Run `rg -n "HistoryRow" src`. Delete the file only when the only match is itself, then rerun and expect no matches.

- [ ] **Step 6: Run focused tests**

```bash
npm test -- --runInBand src/features/analysis/domain/__tests__
```

Expected: all analysis domain tests pass.

- [ ] **Step 7: Type-check the report home**

```bash
npx tsc --noEmit
```

Expected: TypeScript exits with code 0.

- [ ] **Step 8: Commit the report home**

```bash
git add 'src/app/(tabs)/analysis/index.tsx' 'src/app/(tabs)/analysis/history.tsx' src/features/analysis/hooks/queries/useAnalysisQueries.ts src/features/analysis/components/HistoryRow.tsx
git commit -m "feat(analysis): make report history the tab home"
```

---

### Task 4: Dedicated Report Type Selection

**Files:**
- Create: `src/features/analysis/components/AnalysisTypeCard.tsx`
- Create: `src/app/(tabs)/analysis/create.tsx`
- Modify: `src/app/(tabs)/analysis/_layout.tsx`
- Modify: analysis ko/en locales
- Verify unchanged: `src/features/analysis/components/AnalysisTypeSheet.tsx`
- Remove: `src/features/analysis/components/AnalysisBigCard.tsx`

**Interfaces:**
- Produces: `AnalysisTypeCard({ meta, onPress })`
- Produces: `/(tabs)/analysis/create`
- Navigates: sheet CTA → `/(tabs)/analysis/select?type=<AnalysisType>`

- [ ] **Step 1: Add exact creation copy**

```json
{
  "create": {
    "title": "새 리포트 만들기",
    "guide": "지금 받고 싶은 이야기를 골라주세요. 카드를 누르면 자세한 내용을 볼 수 있어요."
  },
  "types": {
    "thinkingPattern": {
      "shortDescription": "반복되는 생각과 감정의 흐름을 살펴봐요."
    },
    "warmReflection": {
      "shortDescription": "지금의 나에게 따뜻한 편지를 받아요."
    },
    "start": "이 리포트로 시작하기"
  }
}
```

English: `Create a new report`, `Choose the story you want to hear. Tap a card to learn more.`, both short descriptions, and `Start with this report`.

- [ ] **Step 2: Implement the full-card press target**

```ts
interface AnalysisTypeCardProps {
  meta: AnalysisTypeMeta;
  onPress: () => void;
}
```

Render only character, localized name, and `shortDescription`. Do not render a pill, inline CTA, arrow, or nested button. Use the outer accessible Pressable and the existing type palette surface.

- [ ] **Step 3: Build the create screen**

```ts
const [sheetMeta, setSheetMeta] = useState<AnalysisTypeMeta | null>(null);
```

Render a back header, guide, all type cards, and existing `AnalysisTypeSheet`. The card opens the sheet. `onStart` closes it and pushes the typed select route.

- [ ] **Step 4: Register the route**

```tsx
<Stack.Screen name="create" options={{ animation: 'slide_from_right' }} />
```

Keep `history`, `select`, and `[id]` registered.

- [ ] **Step 5: Preserve the detailed sheet**

Keep description, highlights, duration, AI disclaimer, and bottom `types.start` CTA. No navigation occurs before the CTA press.

- [ ] **Step 6: Remove AnalysisBigCard safely**

Run `rg -n "AnalysisBigCard" src`. Delete only when the only match is itself, then rerun and expect no matches.

- [ ] **Step 7: Type-check the creation flow**

```bash
npx tsc --noEmit
```

Expected: TypeScript exits with code 0.

- [ ] **Step 8: Commit the creation flow**

```bash
git add 'src/app/(tabs)/analysis/create.tsx' 'src/app/(tabs)/analysis/_layout.tsx' src/features/analysis/components/AnalysisTypeCard.tsx src/features/analysis/components/AnalysisBigCard.tsx src/locales/ko/analysis.json src/locales/en/analysis.json
git commit -m "feat(analysis): separate report type selection"
```

---

### Task 5: Answer Selection Context and Neutral Period Copy

**Files:**
- Modify: `src/app/(tabs)/analysis/select.tsx`
- Modify: `src/features/analysis/constants/analysisTypes.ts`
- Modify: `src/features/analysis/types/api.ts`
- Modify: `src/features/analysis/api/mockAnalysis.ts`
- Modify: analysis ko/en locales

**Interfaces:**
- Consumes: route `type`, `ANALYSIS_TYPE_META`
- Preserves: 10–15 selection and `CreateAnalysisRequest`

- [ ] **Step 1: Add selection-context copy**

```json
{
  "select": {
    "reportLabel": "{{name}}에 사용할 답변이에요",
    "currentCycleHint": "현재 연차에 쌓인 답변 중에서 선택할 수 있어요."
  }
}
```

English: `Answers for {{name}}` and `Choose from answers collected in your current year.`

- [ ] **Step 2: Validate the type parameter**

```ts
export function isAnalysisType(value: string | undefined): value is AnalysisType {
  return value === 'THINKING_PATTERN' || value === 'WARM_REFLECTION';
}
```

Derive `selectedMeta = isAnalysisType(type) ? ANALYSIS_TYPE_META[type] : null`. Invalid params disable submission and replace the route with `/(tabs)/analysis/create` from an effect. Valid params display the localized report name and current-cycle hint above the existing guide. Do not change selected IDs or mutation payload.

- [ ] **Step 3: Remove week-specific comments and copy without changing the enum**

Keep `COOLDOWN` until the server contract changes. Change its comment to “현재 이용 기간의 생성 제한” and use neutral Korean copy:

```json
{
  "title": "지금은 새 리포트를 만들 수 없어요",
  "message": "다음 리포트까지 {{days}}일 남았어요.",
  "hint": "답변을 더 쌓아두면 다음 리포트에서 더 깊은 이야기를 볼 수 있어요."
}
```

English: `You can't create a new report yet`, `{{days}} days until your next report.`, and `Gather more answers for a deeper report next time.` Update the mock comment to say the period limit is not enforced. Do not model the future type-specific monthly response before its server schema is confirmed.

- [ ] **Step 4: Run analysis domain tests**

```bash
npm test -- --runInBand src/features/analysis/domain/__tests__
```

Expected: all analysis domain tests pass.

- [ ] **Step 5: Type-check the selection flow**

```bash
npx tsc --noEmit
```

Expected: TypeScript exits with code 0.

- [ ] **Step 6: Commit selection context and copy**

```bash
git add 'src/app/(tabs)/analysis/select.tsx' src/features/analysis/constants/analysisTypes.ts src/features/analysis/types/api.ts src/features/analysis/api/mockAnalysis.ts src/locales/ko/analysis.json src/locales/en/analysis.json
git commit -m "refactor(analysis): clarify report selection context"
```

---

### Task 6: Documentation and End-to-End Verification

**Files:**
- Modify: `README.md`
- Verify: `docs/planning/ai-리포트-uiux기획.md`

**Interfaces:**
- Consumes: Tasks 1–5
- Produces: synchronized navigation docs and evidence-backed QA

- [ ] **Step 1: Update the README navigation tree**

```text
│  ├─ analysis/             # AI 리포트
│  │  ├─ index.tsx          # 생성 진입 + 전체 리포트 목록
│  │  ├─ create.tsx         # 리포트 종류 선택 + 상세 소개 시트
│  │  ├─ select.tsx         # 현재 연차 답변 선택
│  │  ├─ [id].tsx           # 결과 상세
│  │  └─ history.tsx        # 이전 경로 호환용 홈 리다이렉트
```

Do not add the deferred `sources` route.

- [ ] **Step 2: Run the full Jest suite**

```bash
npm test -- --runInBand
```

Expected: all Jest suites pass.

- [ ] **Step 3: Run the full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: TypeScript exits with code 0.

- [ ] **Step 4: Verify formatting and changed-file scope**

```bash
git diff --check
git status --short
```

Expected: diff check exits 0, and only task files plus pre-existing untracked user files appear.

- [ ] **Step 5: Android manual QA first**

At 360dp and 420dp, light and dark:

1. Bottom label is `리포트`.
2. One create entry and the full report list share the home.
3. Processing reports precede completed reports and include text status.
4. Empty/loading/error list states retain the create entry.
5. Create entry opens type selection.
6. Full type card opens the detailed sheet with no inline CTA.
7. Sheet CTA opens answer selection with the selected report name.
8. Back order is select → create → report home.
9. Screen and card surfaces remain distinct.
10. Both result types still render and feedback submission still replaces the controls with the thank-you message.

- [ ] **Step 6: Repeat the same ten checks on iOS**

Additionally verify safe-area spacing, modal dismissal, and swipe/back behavior.

- [ ] **Step 7: Commit README after successful QA**

```bash
git add README.md
git commit -m "docs(analysis): sync report navigation"
```

---

## Source API Follow-Up Boundary

Create a separate plan only after the server provides:

- endpoint method and path
- pagination behavior
- snapshot identifier
- answer date field
- snapshotted question field
- snapshotted answer field
- authorization and not-found behavior

That follow-up adds the Source API method, TanStack Query key/hook, `/(tabs)/analysis/[id]/sources` screen, result-header link, state handling, mock parity, and Android/iOS QA. It must read immutable snapshot fields and must not substitute current editable answers.
