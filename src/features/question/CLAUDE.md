# features/question — 캐시 설계 불변식

이 feature의 핵심 복잡도는 **세 쿼리 캐시의 정합성**이다. 파일 구조는 코드를 읽어라.

## 캐시 토폴로지 (`useQuestionQueries.ts`의 `questionQueryKeys`)

| 키 | 값 | 소비처 |
|---|---|---|
| `daily(date)` | 단일 `DailyQuestionDomain` | 카드 뷰, 답변 화면 |
| `calendar(월의 15일)` | `DailyQuestionDomain[]` 배열 | 달력 시트 |
| `timeline` | InfiniteData (페이지 누적) | 홈 타임라인 뷰 |

- **리스트와 단일 객체는 같은 키를 공유할 수 없다** — queryFn 반환값이 그대로 캐시 값이다. calendar가 `daily(baseDate)`를 안 쓰고 별도 키인 이유 (`useCalendarHistory` 주석).
- **시딩 규약**: 히스토리성 조회(`useDailyHistory` / `useCalendarHistory` / timeline queryFn)는 응답의 **모든 날짜를 `daily(date)`에 setQueryData로 시딩**한다. 타임라인/달력에서 카드 탭 시 즉시 표시가 이 시딩에 의존 — 새 히스토리성 API를 추가하면 같은 시딩을 유지할 것.

## 타임라인 커서 규칙

- 서버 조회는 baseDate **포함(inclusive)** 과거 방향 → 다음 커서 = 응답 `startDate`(가장 과거 기록일) **− 1일**. 빼먹으면 경계 날짜가 중복 조회된다 (select의 seen-Set은 방어일 뿐).
- 빈 결과면 `startDate`가 null (OpenAPI 명세) → 페이지네이션 종료.
- `initialPageParam`(오늘 날짜)은 **호출 시점 평가** — useMemo 등으로 박제하면 자정 넘긴 뒤 어제로 고정된다.

## Mutation → 캐시 동기화 규약 (`useQuestionMutations.ts`)

- **질문 변경**(뽑기/리로드/선택): `timeline` invalidate — 재진입 시 1회 refetch.
- **답변 생성/수정**: `applyAnswerToTimeline`으로 timeline 페이지를 **수술적 패치** (해당 날짜가 미로드 범위면 invalidate 폴백) → 답변 후 재진입 refetch 0회. 이 보장을 invalidate로 "단순화"하지 말 것 — 설계 왕복 끝에 확정된 패턴.
- `QUESTION-004`(중복 답변)는 silent 코드: `useCreateAnswer`가 `onDuplicateAnswer` callback으로 message + `syncQueries` closure를 넘기고, 컴포넌트가 로컬 AlertDialog 표시. 컴포넌트는 queryClient/쿼리 키를 직접 만지지 않는다.

## 날짜 처리

- 날짜 문자열(`YYYY-MM-DD`)은 **split 후 로컬 Date로 생성** (`prevDayString`, `formatLocalDate` 패턴). `new Date('YYYY-MM-DD')`는 UTC로 해석되어 타임존에 따라 하루 밀린다.
- 서버의 "오늘" 판정은 apiClient가 주입하는 `Timezone` 헤더(기기 타임존) 기준 — 클라이언트의 `formatLocalDate()`와 같은 기준이어야 정합.
