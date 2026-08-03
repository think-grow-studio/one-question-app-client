# features/notifications — 불변식과 함정

파일 구조·역할은 코드를 읽어라. 여기엔 코드 한 파일만 봐서는 깨지기 쉬운 규약만 적는다.

## FCM 토큰 규약

- **`useNotificationStore.fcmToken`에는 "서버 등록에 성공한 토큰"만 넣는다** (`pushToken.ts`). SDK 토큰을 서버 등록 없이 store에 넣으면 reconciliation의 no-op 판정(`sdkToken === storedToken`)이 깨져 stale token 복구가 영구히 스킵된다.
- 토큰 등록 실패는 호출측 흐름을 막지 않는다 (`ensurePushTokenRegistered`는 false 반환, 다음 reconcile이 복구).

## 설정 API는 부분 수정이 아니다

- `notificationApi.upsertSetting`은 **PUT 전체 교체**. 한 필드만 바꿀 때도 나머지 필드(alarmTime/timezone/enabled/analysisReportEnabled)를 현재 값으로 pass-through 해야 한다 — 빠뜨리면 다른 설정이 초기화된다 (`useNotificationSettings`의 각 토글이 나머지 값을 실어 보내는 것 참고).
- `analysisReportEnabled`는 서버 미지원 기간의 **로컬 fallback 진실원** (store 주석 참고): 서버 응답에 필드가 있으면 서버 값 우선, PUT에는 항상 포함(서버가 모르면 무시 — forward-compatible).

## 딥링크는 3경로다 (`useNotificationDeepLink`)

1. 포그라운드: expo local notification 탭 (`addNotificationResponseReceivedListener`)
2. 백그라운드: FCM SDK가 표시한 알림 탭 (`onFCMNotificationOpened`)
3. **종료(quit) 상태**: `getInitialFCMNotification` — 인증 + 스플래시 완료(`isAppReady`) 후 **1회만** 처리

새 알림 타입의 라우팅을 추가하면 `routeFromNotificationData` 한 곳만 고치면 되지만, **경로별 표시 주체가 달라 data payload 구조가 3경로 모두 동일한지 확인**해야 한다.

## Android 포그라운드 표시는 브릿지다 (`useFCMLifecycle`)

- iOS 포그라운드 표시는 RNFirebase `firebase.json` presentation option이 담당. Android는 FCM `onMessage` → expo local notification 재발행으로 표시한다. **이 브릿지에서 `Platform.OS !== 'android'` 가드를 제거하면 iOS에서 알림이 중복 표시된다.**
- 채널 라우팅: `ANALYSIS_DONE` → analysisReport 채널, 그 외 → dailyReminder 채널. 새 푸시 타입 추가 시 채널 결정 분기도 갱신할 것. 채널명은 시스템 설정에 노출되는 user-facing 문자열이라 i18n 필수.

## 로그아웃과 탈퇴는 정리 경로가 다르다 (`authCleanup.ts`)

- **로그아웃**: `beforeServerLogout`에서 서버 FCM 토큰 삭제 (액세스 토큰 만료 전에 호출, 실패해도 로그아웃 진행).
- **탈퇴**: `DELETE /api/v1/auth/me`가 서버에서 fcm_token row를 함께 정리한다 — 클라이언트가 `deleteFcmToken`을 부를 필요가 없어 탈퇴 경로는 `cleanupLocalAuth`(로컬 정리)만 탄다.
- `onLocalCleanup`은 두 경로 공통: fcmToken null + `analysisReportEnabled` 기본값 복원 (다음 계정이 이전 계정의 로컬 설정을 물려받지 않도록).

## Reconciliation 정책 (`useFCMReconciliation` + `domain/reconcileDecision`)

- **판단은 `domain/reconcileDecision.ts`(순수 함수), 실행만 훅에 있다.** 이 판단이 틀려도 크래시나 에러 화면이 없이 알림만 조용히 사라져서 사용자가 신고하지 않는다 — Crashlytics가 못 잡는 종류라 **테이블 테스트가 유일한 그물**이다. 규칙을 바꾸면 훅이 아니라 이 함수와 테스트를 먼저 고칠 것.

- **의사(intent)와 능력(capability)을 섞지 않는다. reconcile은 알림 설정을 PUT하지 않는다.** OS 권한 상태를 `enabled`에 써넣으면 권한을 껐다 켠 사용자의 선택이 복구 불가능하게 사라진다(앱은 원래 값을 이미 잊었다). 설정은 사용자의 명시적 조작으로만 바뀐다.
- **권한 게이트는 토큰으로 건다**: 권한 denied면 서버 토큰을 삭제해 전송 경로를 끊고, 권한이 돌아오면 재등록해 설정 그대로 복구된다.
- **삭제는 권한 게이트에만.** 토큰 하나를 두 카테고리가 공유하므로 토큰으로는 카테고리별 차단이 불가능하다 — 그건 서버 발송 필터의 몫이고, "둘 다 off"는 토큰을 남긴다 (`useDisableNotificationMutation`의 재활성화 마찰 최소화 정책과 일관). 반대로 어떤 카테고리도 원하지 않으면 새 토큰을 심지도 않는다.
- **intent 변화로 reconcile이 재실행되지 않는다** — 토글 경로(`useNotificationSettings`)가 자체적으로 권한·토큰을 처리하고, 뮤테이션 `onMutate`가 새 토큰을 store에 선반영해 중복 등록을 막는다. reconcile은 mount 1회 + 백그라운드 복귀에만 돌고 intent는 호출 시점에 읽는다(`readIntent`). effect 의존성에 설정값을 넣지 말 것 — 낙관적 업데이트마다 재실행되며 race가 되살아난다.
- AppState는 **실제로 background에 다녀온 경우만** 재확인한다. `inactive`는 인앱 권한 다이얼로그에서도 발생하고, iOS는 복귀 시 background→inactive→active로 오기도 해 직전 상태만으로는 판정할 수 없다.

## 토큰 등록 경로는 전부 권한 뒤에 있어야 한다

`registerFcmToken`에 도달하는 모든 경로는 **그 앞에 OS 권한 확인이 있어야** reconcile이 세운 게이트가 새지 않는다. 현재 경로와 각자의 관문:

| 경로 | 관문 |
| --- | --- |
| `toggleNotification` / `toggleAnalysisReport` | `requestNotificationPermission()` |
| `useAnalysisPushPrompt` | `getNotificationPermissionStatus()` |
| `onFCMTokenRefresh` (`useFCMLifecycle`) | `if (!currentToken) return` — 토큰이 이미 없으면 되살리지 않음 |
| `useFCMReconciliation` | 권한 확인이 로직 본체 |

**설정 변경 뮤테이션은 토큰을 건드리지 않는다.** `useUpdateNotificationTimeMutation`이 예전엔 `registerFcmToken`을 함께 불렀는데, 권한 없는 상태에서 시간만 바꿔도 토큰이 되살아나 다음 reconcile이 다시 지우는 flapping이 생겼다. 시간 변경은 설정 조작이고 토큰 정합성은 reconcile 단독 책임이다.

## 권한 상태는 3-상태다 — 불리언으로 뭉개지 말 것

- **`undetermined`(아직 요청 전) ≠ `denied`(거부/해제됨).** iOS는 앱이 권한을 한 번이라도 **요청**해야 설정 앱에 알림 항목을 만든다 — `getPermissionsAsync`로 확인만 하는 건 등록이 아니다. 따라서 undetermined 상태에서 "설정에서 켜주세요"로 안내하면 **항목이 없는 화면에 도착하는 막다른 길**이 된다.
- undetermined의 올바른 처방은 **앱 안에서 요청**하는 것(토글을 켜면 `requestNotificationPermission`이 다이얼로그를 띄운다). 그래서 UI는 이 상태를 정상으로 취급한다.
- 이 앱은 **시작 시 권한을 요청하지 않는다** (OS 다이얼로그는 평생 1회라 사용자 의사 표시 후에 쓴다). 요청 지점은 두 토글과 분석 pre-prompt뿐.
- 전달 가능 여부만 필요한 곳(토큰 게이트, 분석 pre-prompt)은 `getNotificationPermissionStatus()` 불리언을 쓴다 — 전달 관점에선 두 상태가 같기 때문. **화면 표시는 `getNotificationPermissionState()` 3-상태를 쓴다.**

## 권한 없음은 설정이 아니라 화면에서 표현한다 (`NotificationSettings`)

- 권한이 **`denied`일 때만** (undetermined 아님) 토글을 끄지 않고 카드들을 '일시정지'로 그린다: 저장된 값 그대로 표시 + `pointerEvents="none"` + 반투명(0.4), 카드 아무 데나 누르면 시스템 설정으로. 역할 분담은 **배너 = "왜 안 오는지", '잠시 멈춤' 라벨 = "설정은 살아 있다"**.
- **'잠시 멈춤' 라벨은 반투명 래퍼 밖에 둔다** — 흐려진 이유를 설명하는 문구가 같이 흐려지면 안 된다.
- **opacity는 중첩되면 곱해진다.** 래퍼(0.4) 안에서 자식이 또 0.4를 걸면 0.16이 되어 사실상 안 보인다. 일시정지 중에는 자식 쪽을 끄는 식으로 한 겹만 적용할 것 (알림 시간 행 참고).
- **"오늘의 질문"과 "분석 리포트"는 별도 카드다.** 전자는 토글+시간 2행 묶음이라 한 카드에 합치면 어디까지가 한 설정인지 경계가 흐려진다 (한 카드+구분선으로 합쳤다가 되돌린 이력).

## Persist 스토어

- `useNotificationStore`는 persist `version: 2` + `migrate`. **필드 추가/변경/삭제 시 version을 올리고 migrate를 갱신**해야 기존 설치 사용자가 깨지지 않는다.
