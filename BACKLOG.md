# Backlog

## TODO

- PROJECT_ARCHITECTURE.md 기반으로
- 오버엔지니어링은 없지만 best practice대로 구현
- 카카오/당근/토스와 같이 깔끔하고 직관적인 UI로
- 반응형으로 구현

---

배너광고 -> 질문/답변 조회 + 답변 작성/수정에서 나오는지
답변하기에서 [작성완료] 버튼과 키패드 사이에 있는 공간이 무엇인지, 그 공간 사이로 버튼이 숨겨짐

언어 설정 변경 옵션
-> 현재: 한국어 locale 고정 (useLanguageStore language: 'ko')
-> 추후 개선 사항:
   1. 회원가입 시 기기 locale을 그대로 사용해서 서버에 전달 (현재는 ko-KR 고정)
   2. 설정 화면에서 한국어 / 영어 선택 가능하도록 LanguagePicker 활성화
      - 언어 변경 시 i18n.changeLanguage() + 서버 locale 업데이트 API 호출
      - 언어 변경 시 member 쿼리 캐시 invalidate 필요 (member.locale 갱신 반영)
      - 질문도 선택한 언어로 변경됨 (서버에서 처리)
   3. 인프라: LanguagePicker 컴포넌트, useUpdateLocaleMutation 훅 이미 구현됨
      → settings.tsx에 <LanguagePicker /> 추가하면 바로 활성화 가능

모두의 생각 (공개 피드) 기능 임시 OFF
-> ENABLE_PUBLIC_FEED = false (src/shared/constants/features.ts)
-> 하단 피드 탭, 답변 공개 토글, 히스토리 공개 뱃지 모두 숨김
-> 오픈 시 ENABLE_PUBLIC_FEED = true 로 변경하면 복원

NetInfo 도입
-> `@react-native-community/netinfo`
-> 오프라인 상태를 미리 감지해서 질문 조회 / 답변 저장 / 피드 / 알림 설정 저장 시 즉시 안내
-> 네트워크 에러가 난 뒤 팝업을 띄우는 방식보다, 버튼 비활성화 / 배너 / 재시도 UX 쪽으로 개선
-> 우선 적용 후보:
   1. 답변 작성/수정 저장
   2. 피드 조회 및 좋아요
   3. 알림 on/off 및 시간 저장

익명 → Apple 계정 연결 (iOS)
-> 현재: 익명 사용자는 settings에서 Google 연결만 가능 (`LinkGoogleButton`)
-> iOS 게스트 사용자가 Apple 계정으로도 영구 전환할 수 있도록 추가 필요
-> 선행 조건: 백엔드 API 존재 여부 확인
   - `/api/v1/auth/apple/link/check` (중복 확인)
   - `/api/v1/auth/apple/link` (연결)
   - 없으면 백엔드 작업 선행 (Apple identityToken 검증 + 기존 익명 계정에 Apple sub 연결)
-> 클라이언트 작업 (백엔드 준비 후 1~2시간):
   1. `shared/types/api.ts`에 `CheckAppleLinkRequest`, `CheckAppleLinkResponse`, `LinkToAppleRequest` 추가
   2. `authApi`에 `checkAppleLink`, `linkToApple` 메서드 추가
   3. `useLinkAppleMutations.ts` 신규 (`useLinkGoogleMutations` 패턴 그대로 + `expo-apple-authentication` 사용)
   4. `LinkAppleButton.tsx` 신규 (`LinkGoogleButton` 패턴 그대로)
   5. `settings.tsx`에서 `Platform.OS === 'ios'`일 때 Apple 버튼도 함께 노출
-> 우선순위: 중간 (App Store 심사 리젝 사유 아님, 출시 후 사용자 데이터 보고 결정 가능)

Android Apple 로그인 추가
-> 현재: Apple 로그인은 iOS에서만 노출 (login.tsx의 `Platform.OS === 'ios'` 분기)
-> Android는 `expo-apple-authentication` 미지원 → 웹 OAuth2 플로우로 별도 구현 필요
-> 작업 범위 (대략 3~4일):
   1. Apple Developer: Service ID + Private Key (.p8) 발급, return URL 등록
   2. 백엔드: client_secret JWT(ES256) 동적 생성, OAuth callback 엔드포인트
   3. 클라이언트: `expo-auth-session` + `expo-web-browser` + deep link 콜백 처리
   4. form_post 응답 형식 처리 (백엔드 콜백 경유 필수)
-> 우선순위: 낮음 (Apple Sign-In 사용자 비율 5~15%, 그중 iOS→Android 이주자만 영향)
-> 트리거: DB에서 `provider = APPLE` 비율이 20% 이상이고 "Android에서 로그인 안돼요" 클레임 발생 시

## DONE

(완료된 작업들)
