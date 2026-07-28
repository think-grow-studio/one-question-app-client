# 질문하나 (One Question) — Frontend

하루 하나의 질문에 답하며 나를 기록하는 모바일 앱. React Native + Expo (iOS / Android).

이 문서가 **아키텍처의 진실원(source of truth)** 이다. 코드 변경으로 이 문서 내용이 사실이 아니게 되면 같은 커밋에서 문서도 갱신한다.

**문서 체계:**

| 문서                      | 내용                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| `README.md` (이 파일)     | 기술 스택, 폴더 구조·책임, 네비게이션, 상태관리, API 계층, 빌드/실행 |
| `CLAUDE.md` / `AGENTS.md` | AI 에이전트 진입점 (핵심 규칙 요약)                                  |
| `docs/decisions/`         | ADR — 번복하면 안 되는 구조적 결정 기록                              |
| `docs/ENV_FLOW.md`        | 환경변수가 빌드/OTA에 흘러가는 전체 경로                             |
| 폴더별 `CLAUDE.md`        | 해당 폴더의 코드만 봐서는 알 수 없는 불변식·함정                     |

---

## 1. Tech Stack

- **Expo SDK 55** / React Native 0.83 / **New Architecture ENABLED** / TypeScript `strict: true`
- **Navigation**: Expo Router — 라우팅은 `src/app/` 파일 기반으로만 정의
- **Server state**: TanStack Query v5 · **Client state**: Zustand v5
- **UI**: Tamagui (layout/spacing/typography/theme) · **List**: `@shopify/flash-list` v2
- **Animation**: react-native-reanimated v4 (worklets는 별도 패키지) — RN Animated API 금지
- **HTTP**: Axios (`services/apiClient.ts` 단일 인스턴스) — `fetch` 직접 사용 금지
- **i18n**: i18next + react-i18next + expo-localization (ko/en — 기기 언어 감지, 미지원 언어와 fallback은 **ko**)
- **Storage**: 토큰 → `expo-secure-store` · 일반 데이터/persist → AsyncStorage
- **Push**: `@react-native-firebase/messaging` (FCM) + expo-notifications (Android 표시 브릿지)
- **Firebase**: analytics / crashlytics / auth (Google·Apple 로그인)
- **Ads**: react-native-google-mobile-ads (AdMob)

`@gorhom/bottom-sheet`는 의존성에 있지만 **사용하지 않는다** — 모든 sheet/dialog는 RN `<Modal>` + visible-gate 패턴 ([ADR-0001](./docs/decisions/0001-bottom-sheet-pattern.md)).

## 2. 빌드 / 실행

```bash
npm run ios              # iOS 시뮬레이터 (ios/ 재생성 + prebuild, APP_ENV=preview)
npm run android          # Android 에뮬레이터 (android/ 재생성, APP_ENV=preview)
npm run mock             # 로컬 mock 서버 (../mock-server-api 필요)
npm test                 # jest (jest-expo/ios preset)
npx tsc --noEmit         # 타입 체크
```

- **환경 결정**: `APP_ENV`(preview | production)가 앱 이름·패키지ID·API URL을 결정한다. API URL은 `app.config.js`에 하드코딩된 `API_URLS[appEnv]`만 사용 — `process.env.API_URL` fallback 금지 (production OTA 번들에 dev URL이 박힌 사고 이력, `app.config.js` 주석 참고).
- **런타임 config 접근**: `constants/config.ts` (`expo-constants` 경유). Ad Unit ID 등은 `.env(.production)`의 `EXPO_PUBLIC_*`로 Metro가 인라인. 전체 흐름은 [docs/ENV_FLOW.md](./docs/ENV_FLOW.md).
- **버전**: buildNumber/versionCode는 EAS remote가 자동 증가 — `app.config.js`의 값은 무시됨. OTA는 `runtimeVersion.policy: appVersion`.
- **빌드/배포**: `npm run build-*` (EAS 로컬/클라우드 빌드), `npm run update-*-production "메시지"` (OTA). iOS 로컬 빌드는 Xcode 26 / Swift 6.2 필요.
- **QA 순서**: Android(Pixel 7/8, API 34) 먼저 검증 → iOS 시뮬레이터에서도 반드시 확인.

## 3. 폴더 구조와 책임

```
src/
├─ app/           # 라우팅·화면 조립 전용 (Expo Router)
├─ features/      # 도메인 로직 — 9개 feature (question, feed, analysis,
│                 #   notifications, answer, auth, member, settings, admob)
├─ services/      # 인프라만 (apiClient, queryClient, storage, tokenRefresh,
│                 #   appVersion, appReview, firebase/)
├─ shared/        # 2+ feature가 쓰는 것만 (stores, types, utils, ui, icons,
│                 #   layout, hooks, theme, error)
├─ constants/     # config(런타임 env), appStoreUrls
├─ locales/       # i18n 번역 (en/, ko/ — feature별 namespace json)
└─ assets/        # 이미지, 폰트
```

**의존 방향 (절대 규칙): `app → features → shared → services`**

- `app/`: 비즈니스 로직 ❌, 직접 API 호출 ❌ — `features/`의 훅을 조립만 한다. app-level 부트스트랩 로직은 훅으로 추출 (`shared/hooks/useAppBootstrap`, `useVersionCheck`; 단 feature 도메인에 속하면 그 feature로 — 예: `useNotificationDeepLink`).
- `shared/`는 `features/`를 임포트하지 않는다. **유일한 명시적 예외**: `AppErrorBoundary` → `features/admob/BannerAdSlot` (크래시 화면 배너는 제품 결정, 코드 주석 참고).
- shared 스토어가 feature 측 정리 작업이 필요하면 **콜백 등록으로 역전**: `useAuthStore.registerAuthCleanup` ← `features/notifications/services/authCleanup.ts`가 `_layout` 모듈 로드 시 등록.
- `services/` = 여러 feature가 쓰는 인프라. 단일 feature의 비즈니스 서비스는 `features/*/services/` (예: notifications).

### Feature 내부 구조

필요한 폴더만 만든다 (모든 feature에 동일 구조 강제 ❌):

```
features/<name>/
├─ api/<name>Api.ts         # HTTP 호출만 — 비즈니스 로직 ❌
├─ hooks/queries/           # useQuery 훅
├─ hooks/mutations/         # useMutation 훅 + 캐시 무효화
├─ components/              # feature 전용 UI (공용은 shared/ui/)
├─ stores/                  # feature-local Zustand (필요시)
├─ services/                # feature 비즈니스 서비스 (필요시)
├─ types/api.ts             # request/response 타입
├─ domain/ constants/ utils/  # 순수 로직 (필요시)
```

- Barrel export(`index.ts`) 사용 안 함 — `@/features/...` 직접 임포트 (path alias는 `tsconfig.json`).
- `shared/`로 옮기는 기준: **실제로 2+ feature가 쓸 때** — 선제적 이동 금지.

## 4. 네비게이션 구조

```
app/
├─ _layout.tsx              # 루트: Provider 조립 + 인증 리다이렉트 + 스플래시 게이트
├─ (auth)/login.tsx         # 로그인 (Google/Apple)
├─ (tabs)/
│  ├─ index.tsx             # 홈 (오늘의 질문 / 타임라인 뷰 토글)
│  ├─ feed.tsx              # 공개 피드
│  ├─ analysis/             # AI 분석: index / select / [id] / history
│  └─ settings.tsx          # 설정
├─ answer/index.tsx         # 답변 작성 — modal, gestureEnabled:false
│                           #   (작성 중 swipe-dismiss로 답변 유실 방지, X 버튼으로만 닫기)
└─ feed/[id].tsx            # 피드 상세
```

- 인증 가드는 `_layout.tsx`에서 `segments` 기반 리다이렉트로 처리. 스플래시(`SplashQuoteScreen`)는 auth 초기화 + OTA 체크(`updateChecked`)가 끝날 때까지 유지된다.
- React Navigation을 직접 설정하지 않는다 — 네비게이션 정의는 `app/` 디렉토리로만.

## 5. 상태관리 전략

### 서버 상태 — TanStack Query

- 모든 서버 데이터는 TanStack Query로만. **서버 응답을 Zustand에 저장 금지.**
- retry: query는 5xx/네트워크/408/429만 1회 (exponential backoff + jitter), mutation은 5xx/네트워크만 1회. 401은 재시도 안 함 (interceptor가 refresh 처리).
- **리스트/페이지네이션 상태는 query cache에 둔다** (`useInfiniteQuery`) — 컴포넌트 state로 내리면 unmount 생존성을 잃어 재진입마다 reload된다 (홈 타임라인 설계 교훈). 리스트(배열)와 단일 객체는 같은 쿼리 키를 공유할 수 없다 (queryFn 반환값 = 캐시 값).
- 백그라운드 prefetch 실패가 에러 dialog를 띄우지 않게 하려면 query `meta.suppressGlobalError` 사용.

### 클라이언트 상태 — Zustand

- UI 상태·로컬 선택·최소 세션 상태만.
- **위치 규칙**: 단일 feature 소비 → `features/*/stores/` · 3+ 모듈(features/services/shared) 소비 → `shared/stores/` (현재: theme, auth, language, apiError).
- persist 스토어는 AsyncStorage + `createJSONStorage`. **persist 스토어의 스키마를 바꾸면 `version` + `migrate`를 반드시 갱신** (예: `useNotificationStore`).
- 서버 미지원 기간의 로컬 fallback 진실원은 예외적으로 허용하되 store에 주석 명시 — 서버 응답에 필드가 생기면 서버 값 우선 (예: `useNotificationStore.analysisReportEnabled`).
- 민감 데이터(토큰)는 Zustand/AsyncStorage에 두지 않는다 → `services/storage.ts`가 SecureStore로 관리.

## 6. API 통신 계층

### apiClient (`services/apiClient.ts`)

- 단일 Axios 인스턴스, timeout 5초. 모든 요청에 자동 주입: `Authorization`(SecureStore 토큰), `Accept-Language`(사용자 선택 언어 우선), `Timezone`(기기 타임존 — **서버의 "오늘" 판정이 이 헤더 기준**).
- 401 → `tokenRefreshService.refresh()`(mutex — 동시 401에도 갱신 1회) 후 원 요청 재시도. refresh 실패 시 조용히 로그아웃.
- 응답 에러는 `ApiErrorResponse`(requestId/status/code/message)로 **정규화만** 하고 reject — 사용자 표시는 하지 않는다.

### 에러 표시 계층 (역할 분리)

| 계층                                                    | 책임                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| interceptor                                             | 401 refresh + 정규화 + Crashlytics(5xx/네트워크만). **showError 호출 금지** |
| `QueryCache`/`MutationCache.onError` (`queryClient.ts`) | default 표시. `SILENT_ERROR_CODES` Set(한 곳)에 있으면 생략                 |
| mutation hook `onError`                                 | 도메인 후속 처리만 (캐시 무효화, 호출자 callback closure 전달). 표시 ❌     |
| `GlobalErrorHandler` (`shared/error/`)                  | `useApiErrorStore` 상태로 AlertDialog 1개 렌더, pathname 변경 시 자동 reset |
| 컴포넌트                                                | mutation hook에 callback만 전달 — `queryClient`/query keys 직접 의존 ❌     |

**Dialog 위치 판단**: confirm이 "닫기만" → 글로벌 `useApiErrorStore.showError()` · confirm 후 화면별 액션(refetch/navigation) 필요 → 컴포넌트 로컬 `<AlertDialog>` + useState. 글로벌 store에 callback을 넣지 않는다.

silent 코드 현재 목록: `QUESTION-004`, `PUBLIC-QUESTION-003/004/005` — 추가/수정은 `services/queryClient.ts` 한 곳에서만. silent 코드는 호출자(mutation hook + 컴포넌트)가 후속 처리를 책임진다.

## 7. UI 컨벤션

- **색 토큰 규칙**: 화면 배경 → `useScreenBackground()` (`shared/theme/`) · 카드/시트/다이얼로그 → `theme.surface` 직접. 카드에 `theme.background` 사용 금지 (다크에서 배경과 동색으로 묻힘), hex 하드코딩 금지.
- **FlashList v2**: `keyExtractor` 필수, `renderItem`은 useCallback으로 안정화, `estimatedItemSize`는 **넘기지 않는다** (v2에서 제거 — 자동 측정). 레퍼런스: `CommonQuestionFeed.tsx`, `HomeTimelineView.tsx`.
- **애니메이션**: Reanimated v4만 (`useSharedValue`/`useAnimatedStyle`, mount/unmount는 `entering`/`exiting`). Moti는 단순 선언적 애니메이션, Lottie는 비인터랙티브 장식만.
- **sheet/dialog**: RN `<Modal>` + visible-gate. AlertDialog는 글로벌/로컬 모두 `shared/ui/AlertDialog/` 재사용.
- **inline style 금지** — Tamagui 또는 StyleSheet.
- **크로스 플랫폼**: UI 변경 시 iOS/Android 양쪽 즉시 확인 (한쪽만 보고 머지 금지). `Platform.OS` 분기는 최후의 수단 — 분기 시 "왜 통합 불가한가" 주석 필수. 알려진 차이: SafeArea/KeyboardAvoiding 동작, iOS Pressable 이중 fire, `app-settings:` iOS 전용 등.
- **머지 전 체크**: iOS+Android 확인 · 360–420dp 폭 · 다크/라이트 모드 · 키보드 뜬 상태 · 권한 거부 흐름.

## 8. i18n

- 사용자 노출 문자열 하드코딩 금지 — Android 알림 채널명처럼 시스템 설정에 노출되는 문자열 포함.
- namespace는 feature 기반: `common / question / answer / feed / auth / settings / analysis` (`src/locales/{en,ko}/`).
- 키는 계층형(`stats.answered`), 복수형은 i18next count 규약. 언어 전환은 `useLanguageStore` (persist).

## 9. 테스트

- **colocated**: 소스 옆 `__tests__/` 폴더 (루트 `__tests__/` 없음). 현재: `question/domain`, `question/constants`, `shared/utils`.
- jest preset `jest-expo/ios`. 전략: 순수 도메인 로직·유틸 위주 최소 테스트 (MVP 단계) — UI/훅 테스트는 사용자 증가 후 확대.

## 10. 금지 사항 (Do NOT)

- ❌ `fetch` 직접 사용 · 401 화면 처리 · interceptor/mutation에서 showError
- ❌ 서버 데이터를 Zustand에 저장 · 컴포넌트에서 `useQueryClient()`로 직접 invalidate
- ❌ Redux/MobX/새 아키텍처 패턴 도입 · `app/`에 비즈니스 로직
- ❌ RN Animated API · 인터랙티브 UI에 Lottie · `@gorhom/bottom-sheet`
- ❌ `any` 타입 · inline style · 사용자 노출 문자열 하드코딩
- ❌ 토큰을 AsyncStorage/Zustand에 저장 (SecureStore만)
- ❌ FlashList `keyExtractor` 생략 / `estimatedItemSize` 전달
- ❌ 카드 배경에 `theme.background` · 컴포넌트에 hex 하드코딩
- ❌ `app.config.js`에서 `process.env.API_URL` fallback
