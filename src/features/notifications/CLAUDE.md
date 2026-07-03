# features/notifications — 불변식과 함정

파일 구조·역할은 코드를 읽어라. 여기엔 코드 한 파일만 봐서는 깨지기 쉬운 규약만 적는다.

## FCM 토큰 규약

- **`useNotificationStore.fcmToken`에는 "서버 등록에 성공한 토큰"만 넣는다** (`pushToken.ts`). SDK 토큰을 서버 등록 없이 store에 넣으면 reconciliation의 no-op 판정(`sdkToken === storedToken`)이 깨져 stale token 복구가 영구히 스킵된다.
- 토큰 등록 실패는 호출측 흐름을 막지 않는다 (`ensurePushTokenRegistered`는 false 반환, 다음 reconcile이 복구).

## 설정 API는 부분 수정이 아니다

- `notificationApi.upsertSetting`은 **PUT 전체 교체**. 한 필드만 바꿀 때도 나머지 필드(alarmTime/timezone/enabled/analysisReportEnabled)를 현재 값으로 pass-through 해야 한다 — 빠뜨리면 다른 설정이 초기화된다 (`useFCMReconciliation`의 analysisReportEnabled pass-through 참고).
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
- **탈퇴**: 서버가 fcm_token row를 cascade로 정리하므로 **`deleteFcmToken`을 호출하면 "회원을 찾을 수 없다" 에러가 난다** — 탈퇴 경로는 `cleanupLocalAuth`(로컬 정리)만 탄다.
- `onLocalCleanup`은 두 경로 공통: fcmToken null + `analysisReportEnabled` 기본값 복원 (다음 계정이 이전 계정의 로컬 설정을 물려받지 않도록).

## Reconciliation 정책 (`useFCMReconciliation`)

- OS 권한이 denied면 **리마인드(enabled)만 서버에 false 동기화**하고 분석 리포트 설정은 사용자 의사로 남긴다 (권한 재허용 시 되살리는 경로가 따로 있음).
- enabled가 false→true로 전이된 직후의 effect 재실행은 첫 reconcile을 skip한다 — `useEnableNotificationMutation`의 토큰 등록과 race하기 때문. 이 가드 로직(`justEnabled`)을 단순화하지 말 것.

## Persist 스토어

- `useNotificationStore`는 persist `version: 2` + `migrate`. **필드 추가/변경/삭제 시 version을 올리고 migrate를 갱신**해야 기존 설치 사용자가 깨지지 않는다.
