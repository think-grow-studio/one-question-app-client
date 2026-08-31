# One Question Frontend Refactoring — Manual QA Checklist

> `tsc --noEmit` / `npm test`는 구조적 정합성(타입, 순수 로직)만 확인한다.
> 콜백 배선이 바뀌거나 호출 순서가 바뀌는 종류의 회귀는 자동 테스트로 안 잡힌다 — 사람이 눈으로 확인해야 한다.
>
> 이 문서는 [ONE_QUESTION_FRONTEND_REFACTORING_ROADMAP.md](./ONE_QUESTION_FRONTEND_REFACTORING_ROADMAP.md) 진행 중
> **각 Phase 커밋이 실제로 요구하는 수동 확인 항목**을 추적한다. Phase 0 기준 회귀 체크리스트 전체 목록은
> ROADMAP 문서 자체에 있음 — 여기는 "이번 리팩토링이 건드린 코드 경로 위주"로 좁혀서 우선순위를 매긴다.

## 표기 규칙

- `[ ]` 미확인 · `[x] YYYY-MM-DD` 확인 완료(누가/어떤 기기인지 옆에 메모)
- 우선순위: 🔴 최우선(사용자가 눈치채는 실사용 흐름, 미확인 시 리팩토링 계속 진행 비권장) · 🟡 보통 · ⚪ 낮음(엣지케이스)

---

## 🔴 Phase 9 Step 9-1 — silent error 정책을 platform에서 feature로 이동 (`c4f69e0`) — 아직 미확인

ROADMAP이 "UX 회귀 위험 있어 가장 마지막에" 라고 명시했던 그 작업. `SILENT_ERROR_CODES` 중앙 Set을 없애고
각 mutation/query가 `meta.suppressGlobalErrorCodes`로 스스로 선언하도록 바꿨다 — 동작은 코드 단위로 동일해야
하지만, `MutationCache.onError`의 시그니처를 바꿔서(`mutation` 인자 추가) 배선을 다시 짠 부분이라 실제로
다이얼로그가 뜨는지/안 뜨는지 직접 확인이 필요하다.

- [o] 답변을 이미 작성한 날짜에 다시 답변 제출 시도(QUESTION-004): 글로벌 "오류" 다이얼로그 없이, 로컬 다이얼로그만 뜨고 확인 누르면 화면이 나가지는지
- [x] 답변 작성 중 네트워크를 끊고 제출: 이번엔 (QUESTION-004가 아니므로) 글로벌 에러 다이얼로그가 정상적으로 뜨는지 — **이게 제일 중요한 회귀 포인트**, mutation 레벨 suppress가 코드 무관하게 전부 막아버리면 안 됨
- [0] 공개 피드에서 PDQ 없는 날짜 조회(PUBLIC-QUESTION-003): 빈 상태 화면만 뜨고 다이얼로그 없는지
- [x] 공개 피드에서 이미 답변한 질문에 답변 시도(PUBLIC-QUESTION-004): 로컬 다이얼로그 뜨는지 -> 뜨지만, error.public-question.answer-already-exists 로 메시지가 나옴.
- [x] 공개 피드 답변 수정/삭제 시 답변이 이미 사라진 상태(PUBLIC-QUESTION-005): 로컬 다이얼로그 뜨고 동기화되는지 -> 이것도 dialog는 뜨지만, error.public-question... 으로 에서 메시지 안내가 나옴.
- [o] 위 5개 시나리오 각각에서 서버 자체가 죽어있을 때(5xx)는 여전히 글로벌 다이얼로그가 뜨는지 (가능하면 1개만이라도 샘플 확인)

---

## 🔴 Phase 4 — platform 역의존 제거 (`7e68677`) — 아직 전혀 미확인

`apiClient`/`queryClient`가 `useAuthStore`/`useApiErrorStore`를 직접 호출하던 걸 `app/_layout.tsx`가 부트스트랩 시점에
주입하는 콜백(`configureHttpRuntime`/`configureQueryRuntime`)으로 바꿨다. 로직 자체는 그대로 옮겼지만,
**콜백이 실제 첫 요청보다 먼저 등록되는지**는 런타임에서만 확인 가능하다.

- [o] 로그인 (Google)
- [o] 로그인 (Apple)
- [o] 로그아웃
- [ ] 401 발생 → 자동 refresh → 원 요청 재시도 성공 (만료 임박 토큰으로 재현하거나, 서버 토큰 만료 시간 임시 단축)
- [ ] refresh 자체 실패 → 에러 다이얼로그 없이 조용히 로그아웃되는지 (`onUnauthorized` 콜백 배선 확인)
- [ ] 여러 요청이 동시에 401을 받는 상황 → refresh 네트워크 호출이 1번만 나가는지 (네트워크 탭/로그로 확인)
- [ ] 앱 시작 직후 첫 API 요청에서 401이 나도 정상 처리되는지 (콜백이 첫 요청보다 늦게 등록되면 이 케이스가 제일 먼저 깨짐)
- [ ] 임의 API 에러 발생 시 글로벌 에러 다이얼로그가 정상 표시되는지 (`onGlobalError` 콜백 배선 확인 — 네트워크 끊고 아무 화면이나 진입)
- [ ] silent 코드(`QUESTION-004`, `PUBLIC-QUESTION-003/004/005`) 에러는 다이얼로그 없이 조용히 처리되는지
- [ ] 설정에서 언어 전환 후 API 요청의 `Accept-Language` 헤더가 정상 반영되는지 (`LANGUAGE_LOCALE_MAP` 위치 이동 — dev 모드 `[API Request]` 콘솔 로그로 확인)

---

## ⚪ Phase 5 — services → platform 물리 이동 (`cb48428`) — 낮은 우선순위

로직 변경 없이 파일 경로 이동 + import 경로 치환만 했다 (57개 파일). `tsc --noEmit`은 TypeScript 쪽 경로 해석만 검증하고,
실제 번들링은 `babel.config.js`의 `module-resolver` alias(별도로 동기화함)가 담당하므로 **Metro 번들러 기준 cold boot 1회**가
유일하게 tsc/jest로 못 잡는 잔여 리스크다.

- [ ] 앱 cold start (캐시 클리어: `npx expo start --clear` 또는 `npm run android`/`npm run ios`) — 번들링 에러 없이 스플래시 이후 홈 화면까지 정상 도달
- [ ] Firebase 관련 기능 하나만 스팟체크 (예: 화면 진입 시 `logScreenView` 정상 호출 — 크래시 없이 넘어가면 `@/platform/firebase` 배선 확인 충분)
- [ ] 앱 리뷰 요청 프롬프트(`platform/app/appReview.ts`) 또는 버전 체크(`platform/app/appVersion.ts`) 중 하나가 뜨는 흐름에서 정상 동작

---

## ⚪ Phase 6 — shared/type ownership 정리 (`2dfea60`) — 낮은 우선순위

타입 정의 위치만 이동(shared/types → features/\*/types/api.ts), 런타임 로직 변경 없음. 다만 `MemberPermission`을
`member/public.ts`가 아니라 `member/types/api.ts`에서 직접 가져오도록 바꾼 곳(question feature)이 있다 — 의도된
예외이니 회귀는 아니지만, 아래 화면에서 멤버십별 값이 여전히 맞게 나오는지 한 번은 확인.

- [ ] 홈 화면에서 질문 reload 카운트/제한이 멤버십 등급(FREE/PREMIUM)별로 정상 표시되는지
- [ ] 로그인/구글·애플 로그인 연동, 토큰 재발급 흐름에 타입 변경으로 인한 이상이 없는지 (Phase 4 401 체크리스트와 함께 확인해도 됨)

---

## 🟡 Phase 8 — architecture guard 추가 + 기존 위반 24건 정리 (`f3abe5e`)

`npm run lint`(ESLint) 도입 자체는 새 도구지만 코드 동작에 영향 없음. 실제 위험은 가드가 잡아낸 **24건의 기존 cross-feature
deep import를 고치며 건드린 파일 수가 많다**는 점 — admob 배너/전면 광고, 답변 작성, 소셜 로그인 연동, 언어 설정 등
서로 다른 화면 다수를 스치듯 건드렸다. 전부 "import 경로만 public.ts로 교체"라 로직은 그대로지만, 넓게 건드린 만큼 한 번
훑어보는 게 안전하다.

- [ ] 홈 타임라인/피드에서 배너 광고(`BannerAdSlot`)가 정상 노출되는지 (광고 무료 회원은 안 뜨는지도 함께)
- [ ] 리로드 시트(`ReloadOptionSheet`) 진입 시 전면 광고(`useInterstitialAd`)가 정상 트리거되는지
- [ ] 답변 작성/수정(`DailyQuestionAnswer`) 정상 동작
- [ ] 구글/애플 계정 연결(설정 화면) 후 member 정보가 최신으로 갱신되는지 (`invalidateMemberMe`로 교체된 부분)
- [ ] 설정에서 언어 변경(`LanguagePicker`) 정상 반영
- [ ] 날짜 선택 시트(`DatePickerSheet`)에서 회원 등급에 따른 과거 날짜 제한이 정상 동작하는지
- [ ] `npm run lint`가 CI/로컬에서 정상 통과하는지 (새 스크립트라 한 번은 직접 실행 확인)

---

## 🟡 Phase 7 — analysis/app 내부 책임 정리 (`2822cbb`, `304dc73`, `373fed0`, `fddb0df`)

Step 7-1(domain→model 리네임)/7-3(mock 파일명)/7-4(bootstrap 훅 이동)는 경로만 바뀌었다. **Step 7-2만 실제 로직을
재작성**했다 — 분석 랜딩 화면의 쿨다운 일수 계산 + 상태 메시지 분기를 `analysisAvailabilityPresentation.ts`로 뽑아냈다.
순수 함수 단위 테스트는 추가했지만, 실제 화면에서 문구가 그대로 나오는지는 확인 안 됨.

- [ ] 분석 탭 진입 시 "리포트 만들기" 카드의 상태 문구가 답변 부족/쿨다운/생성 중 각 상황에서 정확히 뜨는지
      (특히 쿨다운 남은 일수 숫자가 이전과 동일하게 계산되는지)
- [ ] 답변이 충분하고 쿨다운도 없는 정상 상태에서는 문구 없이 버튼이 활성화되는지
- [ ] 앱 시작 시 OTA 체크(`useAppBootstrap`)와 버전 강제 업데이트 다이얼로그(`useVersionCheck`)가 여전히 정상 동작하는지 (경로만 이동했지만 부트스트랩 타이밍이 앱 시작 흐름의 핵심이라 한 번은 확인)

---

## 🟡 Phase 2 — analysis ↔ notifications 순환 제거 (`b06653a`, `d2a7f9b`, `af1d643`, `e53fc03`)

- [ ] 분석 요청 제출 전 알림 권한 pre-prompt: 권한 없음 → 다이얼로그 → "거절"해도 분석 요청은 진행되는지
- [ ] 같은 pre-prompt에서 "수락" → 권한 요청 다이얼로그 → 승인/거부 각각 → 분석 요청은 항상 진행되는지
- [ ] ANALYSIS_DONE 푸시 수신 시 분석 쿼리가 갱신되는지 — 포그라운드
- [ ] ANALYSIS_DONE 푸시 수신 시 분석 쿼리가 갱신되는지 — 백그라운드
- [ ] 알림 탭 → 분석 결과 화면 딥링크 — 포그라운드(로컬 알림 탭)
- [ ] 알림 탭 → 분석 결과 화면 딥링크 — 백그라운드(FCM 탭)
- [ ] 알림 탭 → 분석 결과 화면 딥링크 — 종료(quit) 상태에서 탭으로 앱 시작
- [ ] ANALYSIS_DONE이 아닌 일반 알림 탭 시 홈으로 이동하는지
- [ ] Android 포그라운드 알림이 여전히 채널별로(분석 리포트 vs 리마인드) 정상 표시되는지, iOS에서 중복 표시 없는지

⚪ **엣지케이스**: 종료 상태 앱 시작 직후, OTA 업데이트 체크가 끝나지 않은 아주 짧은 순간에 알림을 탭하는 경우
(`isAppReady` 수정, `e53fc03`) — 재현이 어려워 낮은 우선순위.

---

## 🟡 Phase 3 — cross-feature public contract (`438d4f9`, `de470a3`)

- [ ] 분석 답변 선택 화면(`select.tsx`)에서 타임라인 답변 목록이 정상 로드/무한스크롤되는지 (`question/public.ts` 경유로 변경)
- [ ] 알림 시간 변경 낙관적 업데이트: 변경 즉시 UI 반영 → 성공 시 유지
- [ ] 알림 시간 변경 실패 시 롤백되는지 (네트워크 끊고 시도)
- [ ] 알림 on/off 토글: 켜기(권한 요청 포함) / 끄기 각각 정상 동작
- [ ] 알림 on/off 토글 실패 시 롤백되는지
- [ ] 분석 리포트 알림 토글: 켜기/끄기 낙관적 업데이트 + 실패 롤백
- [ ] 위 4개 뮤테이션 모두 성공/실패 후 최종적으로 서버 값과 화면이 재동기화되는지 (`invalidateMemberMe` 배선 확인)

---

## 사용법

1. Phase 5 이후로 진행하기 전, 최소 🔴 Phase 4 항목은 실기기/시뮬레이터에서 한 번 훑어보는 걸 권장.
2. 확인한 항목은 `[x] 2026-08-19 (iOS 시뮬레이터)`처럼 날짜/기기 남기고 체크.
3. 이후 Phase(5~9)에서 새로운 수동 확인이 필요한 변경이 생기면 이 문서에 섹션을 추가한다.
