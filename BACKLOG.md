# Backlog

## 공통 가이드라인 (모든 작업)

- PROJECT_ARCHITECTURE.md 기반으로
- 오버엔지니어링은 없지만 best practice대로 구현
- 카카오/당근/토스와 같이 깔끔하고 직관적인 UI로
- 반응형으로 구현

---

- 리로드 시트 / 캘린더 닫을 때 위아래 스와이프 같은 형태로 닫을 수 있는지, 지금은 맨 위에를 누르거나, 맨 위에만 눌러서 아래로 내리거나 해야하는 불편함이 있음.

## 운영 상태 메모

모두의 생각 (공개 피드) 기능 임시 OFF
-> `ENABLE_PUBLIC_FEED = false` (`src/shared/constants/features.ts`)
-> 영향: 하단 피드 탭, 답변 공개 토글, 히스토리 공개 뱃지 모두 숨김
-> 오픈 시 `ENABLE_PUBLIC_FEED = true` 로 변경하면 복원

---

## TODO

### 우선순위: 높음 (출시 전 필수)

스토어 URL / 리뷰 플로우 iOS·Android 분리 점검
-> 업데이트 URL: `src/constants/appStoreUrls.ts`에 ios/android 분리되어 있으나 iOS는 `idXXXXXXXXXX` placeholder (TODO) → App Store Connect 등록 후 실제 ID로 교체
-> 사용처: `src/shared/ui/VersionCheckDialog/VersionCheckDialog.tsx`, `src/app/_layout.tsx:244` (Platform.OS 분기)
-> 리뷰 요청: `src/services/appReview.ts`에서 `expo-store-review` 사용 → OS별 in-app review 다이얼로그를 SDK가 처리 (URL 분리 불필요)

- 다만 `isAvailable=false` & `hasAction=false` 케이스 fallback 없음 → 스토어 URL로 보내는 fallback 추가 검토 (이때도 ios/android 분기 필요)
  -> AdMob도 iOS/Android ID 분리 확인 완료 (App ID, Ad Unit ID 모두 `EXPO_PUBLIC_ADMOB_IOS_*` / `_ANDROID_*` 분기)
- 단 `EXPO_PUBLIC_ADMOB_BANNER_ID`, `EXPO_PUBLIC_ADMOB_REWARDED_ID` (플랫폼 비분리) 변수가 우선 적용되는 fallback이 `adUnits.ts:33-34`에 있음 → .env에 이 변수가 설정돼 있으면 양 플랫폼이 같은 ID 공유하게 됨, 의도된 게 아니면 제거

답변 작성 화면 — [작성완료] 버튼이 키패드에 가려지는 이슈
-> 증상: 답변하기 화면에서 [작성완료] 버튼과 키패드 사이에 빈 공간이 있고, 그 사이로 버튼이 숨겨짐
-> 원인 추정: KeyboardAvoidingView 설정 / keyboardVerticalOffset / SafeAreaInsets 처리 누락
-> 관련 파일: `src/features/answer/components/DailyQuestionAnswer.tsx`
-> 영향: 답변 작성은 핵심 기능 — 키패드 띄운 상태에서 [작성완료] 못 누르면 사용자가 답변 저장 못함

### 우선순위: 중간 (출시 전 권장)

iOS 알림(알람) 설정 점검
-> 현재 알림 UX는 Android 기준으로 작성됨 — settings 화면의 `exactAlarm*` 키 (`locales/*/settings.json`)와 안내 다이얼로그는 Android `SCHEDULE_EXACT_ALARM` 권한 전용. iOS에서는 의미 없음.
-> 점검 항목:

1.  Android-only 분기 정리: `exactAlarm*` 안내는 `Platform.OS === 'android'`로 가드 (iOS에서 노출 X)
2.  iOS 알림 권한 미허용 케이스: `expo-notifications`의 `getPermissionsAsync()` 결과 `denied`/`undetermined`일 때 다이얼로그 + `Linking.openURL('app-settings:')` 으로 시스템 설정 이동 (Android는 `app-settings:` 동작 안 함 → 분기)
3.  알림 시간 변경 시 iOS 동작 검증: `scheduleNotificationAsync` 가 매일 반복 알림으로 정상 갱신되는지, 시뮬레이터/실기기에서 확인
4.  권한 요청 타이밍: 첫 로그인 직후 vs 알림 토글 ON 시점 — iOS는 한 번 거부되면 다시 못 띄우므로 토글 ON 시점이 안전
5.  포커스 모드(집중 모드) / 방해 금지 영향 안내 필요 여부 검토
6.  다크모드 + ko/en/ja 다국어 키 추가 (`notification.iosPermissionDenied*` 등 신규 키)
    -> 관련 파일:

- `src/features/settings/services/notifications.ts`
- `src/features/settings/components/NotificationSettings.tsx`
- `src/locales/{ko,en}/settings.json` notification 섹션
  -> 영향: 출시 전 iOS 사용자 첫 인상에 직결

배너광고 노출 위치/정책 검증
-> 의문점: 질문/답변 조회 + 답변 작성/수정 화면에서 광고가 의도대로 노출되는지
-> 현재 BannerAdSlot 사용처 6곳:

- `src/app/(tabs)/settings.tsx`
- `src/features/answer/components/ReloadOptionSheet.tsx`
- `src/features/answer/components/DailyQuestionAnswer.tsx` (답변 작성/수정)
- `src/features/question/components/DatePickerSheet.tsx`
- `src/features/question/components/QuestionHistoryView.tsx` (질문 조회)
- `src/shared/error/AppErrorBoundary.tsx`
  -> 검증 항목:

1.  6개 화면 모두 무료 회원에게 광고 정상 노출되는지 실기기 확인
2.  AppErrorBoundary는 게이트 없이 노출 — 의도(에러 화면도 매출원)인지, 또는 추가 게이트 필요한지 정책 확정
3.  노출되어선 안 될 화면이 빠져있는지 (예: 결제 화면, 로그인 화면 등 — 현재는 추가된 곳이 의도된 6곳)

NetInfo 도입
-> `@react-native-community/netinfo`
-> 오프라인 상태를 미리 감지해서 질문 조회 / 답변 저장 / 피드 / 알림 설정 저장 시 즉시 안내
-> 네트워크 에러가 난 뒤 팝업을 띄우는 방식보다, 버튼 비활성화 / 배너 / 재시도 UX 쪽으로 개선
-> 우선 적용 후보:

1.  답변 작성/수정 저장
2.  피드 조회 및 좋아요
3.  알림 on/off 및 시간 저장

전역 mutation retry 정책 + interceptor dialog 중복 표시 정리
-> 현재 `services/queryClient.ts:65-75`에 mutation retry: 5xx/네트워크 1회 자동 재시도 설정
-> `services/apiClient.ts:114-119`의 `useApiErrorStore.showError`가 매 응답 실패마다 발화 → retry 발생 시 dialog가 두 번 뜸 (첫 실패 + 최종 실패)
-> Best practice: axios interceptor에서 dialog 표시 제거, 각 mutation/query의 onError에서 `useApiErrorStore.showError` 호출. 그러면 retry 후 최종 실패 시점에만 dialog 1회.
-> 작업 범위: `apiClient.ts` interceptor 수정 + 모든 useMutation/useQuery에 onError 콜백 추가
-> 영향: retry 가능한 에러(5xx/네트워크) 발생 시 사용자가 보는 dialog가 1회로 정리됨, 메트릭/UX 모두 깔끔
-> 트리거: 출시 전 권장 — 다만 광범위 변경이라 별도 PR 필요

### 우선순위: 낮음 (출시 후)

언어 설정 변경 옵션
-> 현재: 한국어 locale 고정 (useLanguageStore language: 'ko')
-> 추후 개선 사항:

1.  회원가입 시 기기 locale을 그대로 사용해서 서버에 전달 (현재는 ko-KR 고정)
2.  설정 화면에서 한국어 / 영어 선택 가능하도록 LanguagePicker 활성화
    - 언어 변경 시 i18n.changeLanguage() + 서버 locale 업데이트 API 호출
    - 언어 변경 시 member 쿼리 캐시 invalidate 필요 (member.locale 갱신 반영)
    - 질문도 선택한 언어로 변경됨 (서버에서 처리)
3.  인프라: LanguagePicker 컴포넌트, useUpdateLocaleMutation 훅 이미 구현됨
    → settings.tsx에 <LanguagePicker /> 추가하면 바로 활성화 가능
    -> 트리거: 글로벌 출시 또는 영어권 사용자 유입 시점

iOS 답변 화면 키보드 dismiss UX 재검토 (보류)
-> 문제: iOS는 키보드만 닫는 시스템 제스처 없음 → 답변 작성 화면에서 키보드 dismiss 방법 부재
-> 현재 운용: 사용자는 키보드 띄운 채로 ScrollView 스크롤해서 [작성완료] 버튼까지 내려가 누름. 명시적 dismiss UX 없음.
-> 시도 이력 (모두 보류/원복):

1.  2026-05-05 1차: `InputAccessoryView` (RN built-in) — 첫 진입엔 보이는데 다른 날짜 답변 화면에서 안 뜸 (RN modal/lifecycle 버그). root sibling 이동 + `useId()` 동적 ID 시도했으나 효과 없음.
2.  2026-05-05 2차: `react-native-keyboard-controller` 라이브러리 (`KeyboardToolbar`) 도입 — 동작은 신뢰성 있게 됐으나 **무료 회원의 경우 키보드 위 toolbar가 BannerAd와 겹쳐 시각 충돌 발생**. 원복.
    -> 향후 도입 시 고려할 옵션:
3.  `react-native-keyboard-controller` + 키보드 뜰 때 `BannerAdSlot` 숨기기 (`Keyboard` 이벤트 리스너로 `keyboardWillShow`/`Hide` 추적)
    - 단점: 광고 렌더 사이클 깨짐, impression 메트릭 영향, 깜빡임
4.  화면 빈 공간 `TouchableWithoutFeedback`으로 dismiss
    - 단점: 발견성 낮음 (한국 사용자 익숙도 ↓)
5.  Premium 회원에게만 KeyboardToolbar 노출 - 단점: 정책 복잡, 무료 사용자 차별 UX
    -> 우선순위: 낮음 (현재 흐름 — 스크롤+[작성완료] — 단일 TextInput에서 동작상 무리 없음)
    -> 트리거: 사용자 컴플레인("키보드 못 닫겠어요" 등) 발생 시 또는 광고 정책 변경(예: 답변 화면 광고 제거) 시 재검토

DailyQuestionAnswer 스타일 반응형 일괄 정리
-> 배경: 공통 가이드라인 "반응형으로 구현" 위반 — 일부 스타일이 하드코딩 숫자 사용
-> 대상 (`src/features/answer/components/DailyQuestionAnswer.tsx` styles 객체):

- `scrollContent.paddingBottom: 20`
- `cardContainer.paddingHorizontal: 20`
- `toggleContainer.paddingHorizontal: 20`, `paddingTop: 12`
- `submitContainer.paddingHorizontal: 20`, `paddingTop: 12`, `paddingBottom: 8`
- 그 외 styles 객체 내 모든 숫자 점검
  -> 작업: `sp(...)` (spacing), `fs(...)` (font), `cs(...)` (component) 헬퍼로 교체
- 헬퍼: `src/shared/utils/responsive.ts`
  -> 영향: 작은 단말(iPhone SE 등)에서 패딩 비율 어색하거나, 큰 단말(Pro Max/태블릿)에서 좁아 보이는 케이스 개선
  -> 우선순위: 낮음 (대부분 단말에서 동작은 함, 시각적 폴리시)
  -> 확장 가능성: 다른 화면(QuestionHistoryView, DatePickerSheet, ReloadOptionSheet 등)도 같은 패턴 점검할 수 있음 — grep으로 `paddingHorizontal: \d+`, `fontSize: \d+` 검색해서 일괄 정리 가능
  -> 트리거: 출시 후 또는 코드 정합성 정비 작업 시 묶어서 처리

AdMob LARGE_ANCHORED_ADAPTIVE_BANNER 마이그레이션 (Google 2026-02 deprecation 대응)
-> 출처: Google Ads Developer Blog 2026-02-19 "Android Google Mobile Ads SDK 25.0.0" 릴리즈에서 `ANCHORED_ADAPTIVE_BANNER` deprecated 공지

- 라이브러리 d.ts 코멘트: `node_modules/react-native-google-mobile-ads/lib/typescript/BannerAdSize.d.ts:23`
- 권장: `LARGE_ANCHORED_ADAPTIVE_BANNER`
  -> 트레이드오프:
- **수익은 올라갈 수 있음** (광고 면적이 커지면 CTR/eCPM 상승, Google이 engagement 향상 목적으로 디자인한 사이즈)
- **다만 배너 광고 면적이 2배 정도(50dp → 100dp)로 커져 UX를 해침** — 특히 시트류(ReloadOptionSheet, DatePickerSheet) 안에서는 컨텐츠 영역이 답답해짐. 출시 직전 적용 비추천.
  -> 작업 범위 (대략 0.5일):

1.  `src/shared/ui/ads/BannerAdSlot.tsx` size prop 변경 (`BannerAdSize.ANCHORED_ADAPTIVE_BANNER` → `LARGE_ANCHORED_ADAPTIVE_BANNER`)
2.  `RESERVED_BANNER_HEIGHT` iOS 65→115, Android 50→100
3.  6개 사용처 레이아웃 재검증
4.  시트류에서 광고 영역 커진 만큼 컨텐츠 영역 줄어드는 정도 점검 → 답답하면 selective 적용(시트류만 ANCHORED 유지) 또는 시트 자체 높이 키우기 검토
    -> 트리거: 출시 후 광고 매출/리텐션 안정화 → A/B 시점 / SDK 메이저 업그레이드 필요 시점 / TS strict 진단 정리 시점
    -> 시도 이력: 2026-05-05 1차 시도 → 시트류 UX 답답함 확인하고 원복

Android Apple 로그인 추가
-> 현재: Apple 로그인은 iOS에서만 노출 (login.tsx의 `Platform.OS === 'ios'` 분기)
-> Android는 `expo-apple-authentication` 미지원 → 웹 OAuth2 플로우로 별도 구현 필요
-> 작업 범위 (대략 3~4일):

1.  Apple Developer: Service ID + Private Key (.p8) 발급, return URL 등록
2.  백엔드: client_secret JWT(ES256) 동적 생성, OAuth callback 엔드포인트
3.  클라이언트: `expo-auth-session` + `expo-web-browser` + deep link 콜백 처리
4.  form_post 응답 형식 처리 (백엔드 콜백 경유 필수)
    -> 영향: Apple Sign-In 사용자 비율 5~15%, 그중 iOS→Android 이주자만
    -> 트리거: DB에서 `provider = APPLE` 비율이 20% 이상이고 "Android에서 로그인 안돼요" 클레임 발생 시

---

## DONE

익명 → Apple 계정 연결 (iOS) — 2026-04-28 완료
-> 백엔드 OpenAPI 스펙 확인 후 클라이언트 반영
-> 신규: `src/features/auth/utils/appleNonce.ts`, `useLinkAppleMutations.ts`, `LinkAppleButton.tsx`
-> 수정: `shared/types/api.ts` (Apple 타입 + `rawNonce`/`authorizationCode`), `authApi.ts` (`checkAppleLink`/`linkToApple`), `useAppleLogin.ts` (nonce/authCode 전송), `settings.tsx` (iOS 익명 사용자에 LinkAppleButton 노출), `analytics.ts` (`LINK_APPLE_*` 이벤트), `locales/{ko,en}/settings.json` (`linkApple*` 키)
-> 회원 탈퇴 시 Apple revoke 정상 동작 (서버가 첫 인증 때 `authorizationCode` 보관)
