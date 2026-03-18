# 알림 온보딩 팝업 기능 설계

## 개요

첫 로그인/회원가입 시 딱 한 번, 오후 10시 알림 설정 여부를 묻는 팝업을 노출한다.

- **표시 조건**: `isAuthenticated`가 처음 `true`가 될 때 (AsyncStorage 키로 중복 방지)
- **수락 시**: 시스템 알림 권한 요청 → 매일 22:00 알림 스케줄
- **거절 시**: 팝업 닫힘, 이후 재표시 없음

---

## 아키텍처 원칙 (PROJECT_ARCHITECTURE.md 준수)

| 원칙 | 적용 |
|------|------|
| Feature 전용 UI 컴포넌트 | `features/auth/components/` |
| 전역 UI 상태 | `_layout.tsx` 로컬 `useState` (Zustand store 불필요) |
| 한 번만 표시 여부 추적 | `AsyncStorage` (민감 정보 아님) |
| 애니메이션 | `react-native-reanimated` FadeIn/FadeOut |
| 사용자 문자열 | `locales/ko/auth.json`, `locales/en/auth.json` |

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/features/auth/components/NotificationOnboardingDialog.tsx` | **신규 생성** |
| `src/app/_layout.tsx` | state & 로직 추가 |
| `src/locales/ko/auth.json` | 한국어 문자열 추가 |
| `src/locales/en/auth.json` | 영어 문자열 추가 |

---

## 상세 설계

### 1. `NotificationOnboardingDialog` 컴포넌트

**경로**: `src/features/auth/components/NotificationOnboardingDialog.tsx`

**참고 패턴**: `src/features/answer/components/ReviewPromptDialog.tsx`

**UI**:
```
┌──────────────────────────┐
│     매일 알림을 받아보세요  │  ← title
│                          │
│  매일 오후 10시에 오늘의   │  ← message
│  질문을 알려드릴게요.     │
│  지금 알림을 설정하시겠어요? │
│                          │
│   [ 나중에 ]  [ 설정하기 ] │  ← 50/50 버튼
└──────────────────────────┘
```

**Props**:
```typescript
interface NotificationOnboardingDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  laterLabel: string;
  onConfirm: () => void;
  onLater: () => void;
}
```

**구현 요소**:
- `Modal` (transparent, statusBarTranslucent)
- backdrop: `TouchableWithoutFeedback` + `Animated.View` FadeIn
- dialog: `Animated.View` FadeIn, `theme.surface` 배경
- 버튼: 좌측(나중에) `theme.backgroundSoft`, 우측(설정하기) `accent.primary`
- `useTheme()`, `useAccentColors()`, `fs()`, `sp()`, `radius()`, `deviceValue()`

---

### 2. `_layout.tsx` 변경

**AsyncStorage 키 추가**:
```typescript
const NOTIFICATION_ONBOARDING_KEY = 'notification_onboarding_shown';
```

**State 추가**:
```typescript
const [showNotificationOnboarding, setShowNotificationOnboarding] = useState(false);
```

**첫 로그인 감지 useEffect**:
```typescript
useEffect(() => {
  if (!isAuthenticated) return;
  const checkOnboarding = async () => {
    const shown = await AsyncStorage.getItem(NOTIFICATION_ONBOARDING_KEY);
    if (!shown) {
      setShowNotificationOnboarding(true);
    }
  };
  checkOnboarding();
}, [isAuthenticated]);
```

**핸들러**:
```typescript
// 설정하기
const handleNotificationConfirm = async () => {
  const hasPermission = await requestNotificationPermission();
  if (hasPermission) {
    await scheduleDailyNotification(22, 0);
    useNotificationStore.getState().setEnabled(true);
    useNotificationStore.getState().setTime(22, 0);
  }
  await AsyncStorage.setItem(NOTIFICATION_ONBOARDING_KEY, 'true');
  setShowNotificationOnboarding(false);
};

// 나중에
const handleNotificationLater = async () => {
  await AsyncStorage.setItem(NOTIFICATION_ONBOARDING_KEY, 'true');
  setShowNotificationOnboarding(false);
};
```

**렌더링** (`<VersionCheckDialog />` 아래 추가):
```tsx
<NotificationOnboardingDialog
  visible={showNotificationOnboarding}
  title={t('notificationOnboarding.title', { ns: 'auth' })}
  message={t('notificationOnboarding.message', { ns: 'auth' })}
  confirmLabel={t('notificationOnboarding.confirm', { ns: 'auth' })}
  laterLabel={t('notificationOnboarding.later', { ns: 'auth' })}
  onConfirm={handleNotificationConfirm}
  onLater={handleNotificationLater}
/>
```

---

### 3. i18n 문자열

**`locales/ko/auth.json`** 추가:
```json
"notificationOnboarding": {
  "title": "매일 알림을 받아보세요",
  "message": "매일 오후 10시에 오늘의 질문을 알려드릴게요.\n지금 알림을 설정하시겠어요?",
  "confirm": "설정하기",
  "later": "나중에"
}
```

**`locales/en/auth.json`** 추가:
```json
"notificationOnboarding": {
  "title": "Get daily reminders",
  "message": "We'll remind you of today's question at 10 PM.\nWould you like to enable notifications?",
  "confirm": "Set Reminder",
  "later": "Maybe Later"
}
```

---

## 데이터 흐름

```
첫 로그인 성공
  └─ useAuthStore.login() → isAuthenticated: true
       └─ _layout.tsx useEffect 발동
            └─ AsyncStorage 키 없음
                 └─ showNotificationOnboarding: true
                      └─ NotificationOnboardingDialog 렌더
                           ├─ "설정하기"
                           │    └─ requestPermission()
                           │         └─ 허용 → scheduleDailyNotification(22, 0)
                           │                  → notificationStore 업데이트
                           │         └─ AsyncStorage 저장 → 닫힘
                           └─ "나중에"
                                └─ AsyncStorage 저장 → 닫힘
```

---

## 재사용 함수 (기존 코드)

| 함수 | 경로 |
|------|------|
| `requestNotificationPermission()` | `src/services/notifications.ts` |
| `scheduleDailyNotification(hour, minute)` | `src/services/notifications.ts` |
| `useNotificationStore` | `src/stores/useNotificationStore.ts` |

---

## 검증 방법

1. 앱 완전 삭제 후 재설치 → 로그인 → 팝업 노출 확인
2. "설정하기" → 시스템 알림 권한 팝업 → 허용 → 설정 화면에서 22:00 알림 ON 확인
3. "나중에" → 팝업 닫힘 → 앱 재시작 후 팝업 미노출 확인
4. 기존 로그인 유저 → 팝업 미노출 확인 (AsyncStorage 키 존재)
5. 권한 거부 시 → 알림 미스케줄, store 미업데이트 확인
