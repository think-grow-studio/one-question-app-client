# Backlog

## 공통 가이드라인 (모든 작업)

- PROJECT_ARCHITECTURE.md 기반으로
- 오버엔지니어링은 없지만 best practice대로 구현
- 카카오/당근/토스와 같이 깔끔하고 직관적인 UI로
- 반응형으로 구현

---

## TODO

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

12시 되자마자 모두의 생각 다음으로 안넘어가지는 문제.
