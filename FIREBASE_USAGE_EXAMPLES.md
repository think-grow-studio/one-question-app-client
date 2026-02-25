# 🔥 Firebase 사용 예시

## Analytics 사용법

### 1. 화면 조회 추적

```typescript
import { useEffect } from 'react';
import { logScreenView } from '@/services/firebase';

export default function TodayScreen() {
  useEffect(() => {
    // 화면이 마운트될 때 자동으로 추적
    logScreenView('Today');
  }, []);

  return <View>...</View>;
}
```

### 2. 버튼 클릭 이벤트

```typescript
import { logEvent, AnalyticsEvents } from '@/services/firebase';

export function QuestionCard({ question }) {
  const handleAnswer = async () => {
    // 이벤트 로깅
    await logEvent(AnalyticsEvents.QUESTION_ANSWER, {
      question_id: question.id,
      category: question.category,
      answer_length: answer.length,
    });

    // 실제 로직
    submitAnswer(answer);
  };

  return <Button onPress={handleAnswer}>답변 제출</Button>;
}
```

### 3. 사용자 속성 설정

```typescript
import { setUserId, setUserProperty } from '@/services/firebase';

// 로그인 시
async function handleLogin(user) {
  await setUserId(user.id);
  await setUserProperty('user_type', user.isPremium ? 'premium' : 'free');
  await setUserProperty('sign_up_method', user.provider); // 'google' or 'apple'
}

// 로그아웃 시
async function handleLogout() {
  await setUserId(null);
}
```

### 4. 주요 화면에 추적 추가

**app/(tabs)/today.tsx**
```typescript
useEffect(() => {
  logScreenView('Today');
}, []);
```

**app/(tabs)/collection.tsx**
```typescript
useEffect(() => {
  logScreenView('Collection');
}, []);
```

**app/(tabs)/settings.tsx**
```typescript
useEffect(() => {
  logScreenView('Settings');
}, []);
```

---

## Crashlytics 사용법

### 1. 에러 자동 추적

```typescript
import { recordError } from '@/services/firebase';

try {
  await fetchQuestions();
} catch (error) {
  // Crashlytics에 에러 기록
  recordError(error as Error, 'Failed to fetch questions');

  // 사용자에게 에러 메시지 표시
  Alert.alert('오류', '질문을 불러올 수 없습니다.');
}
```

### 2. 사용자 컨텍스트 추가

```typescript
import { setCrashlyticsUserId, setCrashlyticsAttribute } from '@/services/firebase';

// 로그인 시
async function handleLogin(user) {
  await setCrashlyticsUserId(user.id);
  await setCrashlyticsAttribute('email', user.email);
  await setCrashlyticsAttribute('provider', user.provider);
}
```

### 3. 커스텀 로그

```typescript
import { logCrashlytics } from '@/services/firebase';

async function complexOperation() {
  logCrashlytics('Starting complex operation');

  try {
    logCrashlytics('Step 1: Fetching data');
    await fetchData();

    logCrashlytics('Step 2: Processing data');
    await processData();

    logCrashlytics('Step 3: Saving data');
    await saveData();

    logCrashlytics('Complex operation completed successfully');
  } catch (error) {
    logCrashlytics('Complex operation failed');
    recordError(error as Error);
  }
}
```

### 4. React Error Boundary와 통합

```typescript
// shared/error/AppErrorBoundary.tsx
import { Component } from 'react';
import { recordError } from '@/services/firebase';

export class AppErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Crashlytics에 에러 기록
    recordError(error, `Component: ${errorInfo.componentStack}`);
  }
}
```

---

## 실전 예시

### 로그인 화면 (app/(auth)/login.tsx)

```typescript
import { useEffect } from 'react';
import { logScreenView, logEvent, AnalyticsEvents, setUserId } from '@/services/firebase';
import { setCrashlyticsUserId } from '@/services/firebase';

export default function LoginScreen() {
  // 화면 조회 추적
  useEffect(() => {
    logScreenView('Login');
  }, []);

  const handleGoogleLogin = async () => {
    try {
      // Analytics: 로그인 시도
      await logEvent(AnalyticsEvents.LOGIN, {
        method: 'google',
      });

      const user = await googleLogin();

      // Analytics: 사용자 ID 설정
      await setUserId(user.id);

      // Crashlytics: 사용자 ID 설정
      await setCrashlyticsUserId(user.id);

      // Analytics: 로그인 성공
      await logEvent('login_success', {
        method: 'google',
      });
    } catch (error) {
      // Crashlytics: 에러 기록
      recordError(error as Error, 'Google login failed');

      // Analytics: 로그인 실패
      await logEvent('login_failed', {
        method: 'google',
        error: error.message,
      });
    }
  };

  return <Button onPress={handleGoogleLogin}>Google 로그인</Button>;
}
```

### 오늘의 질문 화면 (app/(tabs)/today.tsx)

```typescript
import { useEffect } from 'react';
import { logScreenView, logEvent, AnalyticsEvents } from '@/services/firebase';
import { recordError } from '@/services/firebase';

export default function TodayScreen() {
  const { data: question, isLoading, error } = useTodayQuestion();

  // 화면 조회 추적
  useEffect(() => {
    logScreenView('Today');
  }, []);

  // 질문 조회 추적
  useEffect(() => {
    if (question) {
      logEvent(AnalyticsEvents.QUESTION_VIEW, {
        question_id: question.id,
        category: question.category,
      });
    }
  }, [question]);

  // 에러 추적
  useEffect(() => {
    if (error) {
      recordError(error as Error, 'Failed to load today question');
    }
  }, [error]);

  const handleAnswer = async (answer: string) => {
    try {
      // Analytics: 답변 제출
      await logEvent(AnalyticsEvents.QUESTION_ANSWER, {
        question_id: question.id,
        answer_length: answer.length,
      });

      await submitAnswer(answer);
    } catch (error) {
      recordError(error as Error, 'Failed to submit answer');
    }
  };

  return <View>...</View>;
}
```

---

## 개발/프로덕션 구분

### 개발 환경에서 Firebase 비활성화 (선택사항)

```typescript
// services/firebase/firebaseApp.ts
import { config } from '@/constants/config';
import analytics from '@react-native-firebase/analytics';

export function initializeFirebase() {
  if (config.isDev) {
    // 개발 환경에서는 Analytics 비활성화
    analytics().setAnalyticsCollectionEnabled(false);
    console.log('Firebase Analytics disabled in development');
  } else {
    analytics().setAnalyticsCollectionEnabled(true);
    console.log('Firebase Analytics enabled');
  }
}
```

---

## Firebase Console에서 확인

### Analytics
1. Firebase Console > Analytics > 대시보드
2. 실시간 사용자 수 확인
3. 이벤트 로그 확인
4. 사용자 속성 확인

### Crashlytics
1. Firebase Console > Crashlytics
2. 크래시 리포트 확인
3. 스택 트레이스 분석
4. 영향받은 사용자 수 확인

---

## 주의사항

1. **개인정보 보호**
   - 사용자 이메일, 비밀번호 등 민감한 정보는 로깅하지 마세요
   - GDPR 준수를 위해 사용자 동의 필요

2. **이벤트 제한**
   - Firebase Analytics는 500개 고유 이벤트 타입 제한
   - 의미 있는 이벤트만 추적하세요

3. **네트워크 최적화**
   - 이벤트는 배치로 전송됩니다
   - 실시간 반영은 아닙니다 (최대 24시간 지연 가능)

4. **테스트**
   - 개발 중에는 Firebase Console의 DebugView 사용
   - `adb shell setprop debug.firebase.analytics.app com.onequestion.app` (Android)
