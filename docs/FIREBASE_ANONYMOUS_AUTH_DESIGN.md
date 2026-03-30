# Firebase 익명 로그인 + Google 계정 연동 설계

## 1. 개요

Firebase 익명 인증을 통한 게스트 로그인과, 이후 설정 화면에서 Google 계정 연동 기능을 추가한다.

### 1.1 범위

| 기능 | 설명 |
|------|------|
| 게스트 입장 | Firebase 익명 인증 → 서버 JWT 발급 |
| Google 계정 연동 확인 | 연동 전 해당 Google 계정 존재 여부 확인 |
| Google 계정 연동 | 익명 사용자 → Google 계정으로 전환 |
| 로그인 화면 UI | 게스트 버튼 추가 |
| 설정 화면 UI | 익명 사용자용 계정 연동 영역 추가 |

### 1.2 백엔드 API 엔드포인트 (제공됨)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/v1/auth/anonymous` | 익명 인증 (Firebase ID Token 검증 → JWT 발급) |
| POST | `/api/v1/auth/check-google-link` | Google 계정 중복 확인 |
| POST | `/api/v1/auth/link-to-google` | 익명 → Google 계정 연동 |

### 1.3 현재 인증 아키텍처

```
[Google Sign-In SDK]
      ↓ idToken
[자체 백엔드 POST /api/v1/auth/google]
      ↓ accessToken + refreshToken (JWT)
[AsyncStorage 저장 + Zustand 상태관리]
```

- Firebase Auth SDK: **미설치** (analytics, crashlytics만 사용 중)
- 유저 식별: 백엔드 자체 Member + JWT
- provider 타입: `'GOOGLE' | 'APPLE'` (ANONYMOUS 없음)

### 1.4 아키텍처 결정 사항

**Firebase는 인증 수단일 뿐, 세션/권한 관리는 자체 JWT로 처리한다.**

- 클라이언트: Firebase `signInAnonymously()` → ID Token 획득 → 서버에 전달
- 서버: Firebase Admin SDK로 ID Token 검증 → 자체 Member 생성 + JWT 발급
- Google 연동 시 Firebase `linkWithCredential()`은 **사용하지 않음** — 서버가 Member의 provider 필드를 직접 전환
- 이유: Google 로그인과 동일한 패턴(idToken → 서버 검증 → 자체 JWT) 유지. Firebase 레벨과 서버 레벨 두 곳의 계정 상태를 동기화할 필요 없음

---

## 2. 인증 플로우

### 2.1 게스트 로그인 플로우

```
[사용자] 게스트 버튼 탭
    ↓
[Firebase Auth] signInAnonymously()
    ↓
[Firebase Auth] Firebase ID Token 획득 (getIdToken)
    ↓
[API] POST /api/v1/auth/anonymous { firebaseIdToken }
    ↓
[서버] Firebase Admin SDK로 ID Token 검증 → Member 생성 (provider: ANONYMOUS) → JWT 발급
    ↓
[클라이언트] accessToken + refreshToken 저장 → 메인 화면 이동
```

### 2.2 Google 계정 연동 플로우

```
[설정 화면] 사용자가 "Google 계정 연동" 탭
    ↓
[Google Sign-In] idToken 획득
    ↓
[API] POST /api/v1/auth/check-google-link { idToken }
    ↓ (이미 존재하는 계정이면 → 사용자에게 안내 후 중단)
    ↓ (존재하지 않으면 → 계속)
[API] POST /api/v1/auth/link-to-google { idToken, email, name }
    ↓
[서버] 익명 Member의 provider를 GOOGLE로 전환 → 새 JWT 발급
    ↓
[클라이언트] 새 토큰 저장 → 사용자 정보 캐시 무효화 → UI 갱신
```

**주의: 이 과정에서 Firebase `linkWithCredential()`은 호출하지 않는다.**
서버가 자체 Member 테이블에서 provider를 직접 전환하므로, Firebase 레벨의 계정 연결은 불필요.

### 2.3 연동 시나리오별 처리

| 시나리오 | 상황 | 서버 처리 | 클라이언트 처리 |
|----------|------|-----------|----------------|
| A | 익명 → Google 연동 (Google 계정 신규) | 익명 Member에 Google 정보 병합, 새 JWT 발급 | 새 토큰 저장, member 쿼리 무효화 |
| B | 익명 → Google 연동 (Google 계정 이미 존재) | 409 응답 (AUTH-013) | `linkGoogleConflict` 메시지 표시, 다른 계정 선택 유도 |
| C | 이미 Google/Apple 연동된 사용자가 재연동 시도 | 400 응답 (AUTH-012) | `linkGoogleAlreadyLinked` 메시지 표시 |

**시나리오 B 정책: 데이터 병합은 하지 않는다.** 사용자에게 "이미 사용 중인 계정"임을 알리고 다른 Google 계정을 선택하도록 유도.

---

## 3. 변경 파일 및 구조

### 3.1 새로 추가되는 파일

```
src/
├─ services/
│  └─ firebase/
│     └─ auth.ts                          # Firebase Auth 래퍼 (signInAnonymously, getIdToken)
├─ features/
│  └─ auth/
│     ├─ hooks/
│     │  ├─ useAnonymousLogin.ts          # 게스트 로그인 훅
│     │  └─ mutations/
│     │     └─ useLinkGoogleMutations.ts  # 계정 연동 관련 mutations
│     └─ components/
│        └─ LinkGoogleButton.tsx          # 설정 화면용 Google 연동 버튼
```

### 3.2 수정되는 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/shared/types/api.ts` | `AnonymousAuthRequest`, `CheckGoogleLinkRequest/Response`, `LinkToGoogleRequest` 타입 추가. `AuthProvider`에 `'ANONYMOUS'` 추가 |
| `src/features/auth/api/authApi.ts` | `anonymousLogin`, `checkGoogleLink`, `linkToGoogle` API 함수 추가 |
| `src/shared/stores/useAuthStore.ts` | `logout` 시 Firebase signOut 추가 |
| `src/app/(auth)/login.tsx` | 게스트 입장 버튼 추가 |
| `src/app/(tabs)/settings.tsx` | 익명 사용자용 계정 연동 UI 추가 |
| `src/locales/ko/auth.json` | 게스트 관련 번역 키 추가 |
| `src/locales/en/auth.json` | 게스트 관련 번역 키 추가 |
| `src/locales/ko/settings.json` | 계정 연동 관련 번역 키 추가 |
| `src/locales/en/settings.json` | 계정 연동 관련 번역 키 추가 |
| `package.json` | `@react-native-firebase/auth` 의존성 추가 |
| `app.config.js` | Firebase Auth 플러그인 설정 (필요 시) |

---

## 4. 상세 구현 설계

### 4.1 타입 추가 (`src/shared/types/api.ts`)

```typescript
// Auth Types - 추가분
export interface AnonymousAuthRequest {
  firebaseIdToken: string;
}

export interface CheckGoogleLinkRequest {
  idToken: string;
}

export interface CheckGoogleLinkResponse {
  exists: boolean;
}

export interface LinkToGoogleRequest {
  idToken: string;
  email?: string;
  name?: string;
}

// AuthProvider 수정
export type AuthProvider = 'GOOGLE' | 'APPLE' | 'ANONYMOUS';
```

### 4.2 Firebase Auth 서비스 (`src/services/firebase/auth.ts`)

```typescript
import auth from '@react-native-firebase/auth';

export async function signInAnonymously(): Promise<string> {
  const credential = await auth().signInAnonymously();
  const idToken = await credential.user.getIdToken();
  return idToken;
}

export async function signOutFirebase(): Promise<void> {
  await auth().signOut();
}

export function getCurrentFirebaseUser() {
  return auth().currentUser;
}
```

**핵심 포인트:**
- `@react-native-firebase/auth`는 이미 프로젝트에 설치된 `@react-native-firebase/app`과 동일 버전 사용 (v23.x)
- Firebase는 `google-services.json` / `GoogleService-Info.plist`를 통해 자동 초기화되므로 추가 설정 불필요
- `services/firebase/` 하위에 배치하여 기존 analytics, crashlytics와 동일 레벨로 관리

### 4.3 API 함수 추가 (`src/features/auth/api/authApi.ts`)

```typescript
// 기존 authApi 객체에 추가
export const authApi = {
  // ... 기존 함수들

  anonymousLogin: (data: AnonymousAuthRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/anonymous', data),

  checkGoogleLink: (data: CheckGoogleLinkRequest) =>
    apiClient.post<CheckGoogleLinkResponse>('/api/v1/auth/check-google-link', data),

  linkToGoogle: (data: LinkToGoogleRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/link-to-google', data),
};
```

### 4.4 게스트 로그인 훅 (`src/features/auth/hooks/useAnonymousLogin.ts`)

```typescript
import { useMutation } from '@tanstack/react-query';
import { signInAnonymously } from '@/services/firebase/auth';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';

export function useAnonymousLogin() {
  const { login } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Firebase 익명 로그인 → ID Token 획득
      const firebaseIdToken = await signInAnonymously();

      // 2. 서버에 익명 인증 요청
      const { data } = await authApi.anonymousLogin({ firebaseIdToken });
      return data;
    },
    onSuccess: async (data) => {
      await login(data.accessToken, data.refreshToken);
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
```

**설계 결정:**
- `useGoogleLogin`과 동일한 패턴 (mutationFn → onSuccess → login)
- Firebase 익명 로그인과 서버 API 호출을 하나의 mutation으로 묶음 (원자적 처리)

### 4.5 Google 계정 연동 훅 (`src/features/auth/hooks/mutations/useLinkGoogleMutations.ts`)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { CheckGoogleLinkResponse } from '@/shared/types/api';

// Google 계정 중복 확인
export function useCheckGoogleLinkMutation() {
  return useMutation({
    mutationFn: async () => {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response) || !response.data.idToken) {
        throw new Error('Google Sign-In failed');
      }

      const { idToken, user } = response.data;
      const { data } = await authApi.checkGoogleLink({ idToken });

      return {
        checkResult: data,
        idToken,
        email: user.email,
        name: user.name ?? undefined,
      };
    },
  });
}

// 익명 → Google 연동 실행
export function useLinkToGoogleMutation() {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { idToken: string; email?: string; name?: string }) => {
      const { data } = await authApi.linkToGoogle(params);
      return data;
    },
    onSuccess: async (data) => {
      // 새 토큰으로 교체
      await login(data.accessToken, data.refreshToken);
      // 사용자 정보 캐시 무효화 (provider가 ANONYMOUS → GOOGLE로 변경됨)
      queryClient.invalidateQueries({ queryKey: ['member', 'me'] });
    },
  });
}
```

**설계 결정:**
- 확인 → 연동을 2단계로 분리 (UX: 사용자에게 확인 기회 제공)
- `checkGoogleLink`에서 Google Sign-In까지 수행하여 idToken을 재사용
- 연동 성공 시 member 쿼리를 invalidate하여 설정 화면이 즉시 갱신됨

### 4.6 AuthStore 수정 (`src/shared/stores/useAuthStore.ts`)

```typescript
// logout 함수에 Firebase signOut 추가
logout: async () => {
  if (isLoggingOut) return;
  isLoggingOut = true;
  try {
    await storage.clearTokens();
    queryClient.clear();

    // 구글 계정 연결 해제
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.warn('Google sign out failed:', error);
    }

    // Firebase 로그아웃 (익명 사용자 세션 정리)
    try {
      await signOutFirebase();
    } catch (error) {
      console.warn('Firebase sign out failed:', error);
    }

    setCrashlyticsUserId(null);
    set({ isAuthenticated: false });
  } finally {
    isLoggingOut = false;
  }
},
```

### 4.7 로그인 화면 UI 변경 (`src/app/(auth)/login.tsx`)

#### 레이아웃 변경

```
기존:
┌────────────────────┐
│       [Logo]       │
│    질문 하나        │
│   매일 하나의 ...   │
│                    │
│ [Google로 로그인]   │
│ [Apple (준비 중)]   │
│                    │
│  약관 동의 문구     │
└────────────────────┘

변경:
┌────────────────────┐
│       [Logo]       │
│    질문 하나        │
│   매일 하나의 ...   │
│                    │
│ [Google로 로그인]   │
│ [Apple (준비 중)]   │
│                    │
│ ── 또는 ──────────  │
│                    │
│ [게스트로 시작하기]  │
│                    │
│  약관 동의 문구     │
└────────────────────┘
```

#### 게스트 버튼 스타일

- 소셜 로그인 버튼보다 시각적으로 덜 강조 (border 없는 텍스트 스타일 또는 ghost 스타일)
- "게스트로 시작하기" / "Continue as Guest"
- 구분선: `── 또는 ──` / `── or ──`

### 4.8 설정 화면 UI 변경 (`src/app/(tabs)/settings.tsx`)

#### 익명 사용자일 때 계정 섹션 변경

```
기존 (GOOGLE/APPLE):
┌─ 계정 ───────────────┐
│ 🔵 Google 계정       │
│ 이메일: user@...     │
│ 질문 시작일: ...     │
└──────────────────────┘

익명 사용자:
┌─ 계정 ───────────────┐
│ 👤 게스트             │
│                      │
│ ⚠️ 계정을 연동하면    │
│ 데이터를 안전하게     │
│ 보관할 수 있습니다    │
│                      │
│ [Google 계정 연동]    │
└──────────────────────┘
```

#### 연동 프로세스 UI

1. "Google 계정 연동" 탭 → Google Sign-In → checkGoogleLink 호출
2. `exists: true` → AlertDialog: "이미 사용 중인 Google 계정입니다"
3. `exists: false` → linkToGoogle 호출 → 성공 시 계정 정보 갱신

### 4.9 Analytics 이벤트

```typescript
// 기존 AnalyticsEvents에 추가
GUEST_LOGIN: 'guest_login',
LINK_GOOGLE_START: 'link_google_start',
LINK_GOOGLE_SUCCESS: 'link_google_success',
LINK_GOOGLE_FAIL: 'link_google_fail',
```

---

## 5. i18n 번역 키

### 5.1 `auth.json` 추가 키

```json
// ko
{
  "guestLogin": "게스트로 시작하기",
  "orDivider": "또는"
}

// en
{
  "guestLogin": "Continue as Guest",
  "orDivider": "or"
}
```

### 5.2 `settings.json` 추가 키

```json
// ko
{
  "account": {
    "providerAnonymous": "게스트",
    "linkGoogleButton": "Google 계정 연동",
    "linkGoogleWarning": "계정을 연동하면 데이터를 안전하게 보관할 수 있습니다",
    "linkGoogleSuccess": "Google 계정이 연동되었습니다",
    "linkGoogleConflict": "이미 사용 중인 Google 계정입니다",
    "linkGoogleAlreadyLinked": "이미 연동된 계정입니다"
  }
}

// en
{
  "account": {
    "providerAnonymous": "Guest",
    "linkGoogleButton": "Link Google Account",
    "linkGoogleWarning": "Link your account to keep your data safe",
    "linkGoogleSuccess": "Google account linked successfully",
    "linkGoogleConflict": "This Google account is already in use",
    "linkGoogleAlreadyLinked": "Account is already linked"
  }
}
```

---

## 6. 의존성 변경

### 6.1 패키지 추가

```bash
npx expo install @react-native-firebase/auth
```

- `@react-native-firebase/app` (v23.8.6)과 동일 버전이 설치됨
- Managed Workflow에서 Expo Config Plugin으로 자동 네이티브 설정

### 6.2 app.config.js 변경

```javascript
plugins: [
  '@react-native-firebase/app',
  '@react-native-firebase/auth',  // 추가
  // ... 기타 플러그인
]
```

### 6.3 EAS Build 필요

- `@react-native-firebase/auth`는 네이티브 모듈이므로 **새 빌드 필요** (EAS Build)
- Expo Go에서는 동작하지 않음 — Development Build 필수

---

## 7. 에러 처리

### 7.1 서버 에러 코드 매핑

| 에러 코드 | HTTP Status | 설명 | 클라이언트 처리 |
|-----------|-------------|------|----------------|
| AUTH-011 | 401 | Firebase 인증 실패 | 재시도 유도 또는 로그인 화면 유지 |
| AUTH-012 | 400 | 이미 연동된 계정 (GOOGLE/APPLE → 재연동 시도) | `linkGoogleAlreadyLinked` 메시지 표시 |
| AUTH-013 | 409 | 이미 존재하는 Google 계정 | `linkGoogleConflict` 메시지 표시 |

### 7.2 클라이언트 에러 처리

- Firebase 익명 로그인 실패: 네트워크 문제 가능성 → 기존 apiClient 에러 처리 패턴 활용
- Google Sign-In 취소: 기존 `useGoogleLogin`의 에러 처리와 동일 패턴

### 7.3 연동 엣지 케이스 처리

| 엣지 케이스 | 상황 | 처리 |
|------------|------|------|
| 연동 도중 앱 종료 | `linkToGoogle` 호출 전/중에 앱이 꺼짐 | 토큰이 갱신되지 않았으므로 기존 익명 토큰 유지 → 다음 접속 시 정상 동작. 연동 미완료 상태이므로 사용자가 다시 시도 가능 |
| 연동 중 JWT 만료 | `linkToGoogle` 호출 시 401 발생 | 기존 apiClient 인터셉터가 자동으로 토큰 갱신 → 재요청. 갱신도 실패하면 로그아웃 처리 (기존 흐름과 동일) |
| Google Sign-In 성공 + 서버 연동 실패 | Google idToken은 받았으나 서버 API 실패 | 클라이언트는 여전히 익명 상태. idToken은 단기 유효이므로 사용자가 재시도 시 새 idToken 획득 |

---

## 8. 알려진 제약 사항

### 8.1 앱 삭제 시 데이터 소실

- 익명 사용자의 Firebase UID는 기기에 종속 → 앱 삭제 시 UID 소실
- AsyncStorage의 refreshToken도 함께 소실 → 서버 데이터 접근 불가
- 서버에 남은 고아 데이터는 별도 삭제하지 않고 유지 (향후 정책 결정 가능)
- **대응:** 설정 화면에서 계정 연동 배너로 지속 유도

### 8.2 멀티 디바이스

- 익명 인증은 기기별로 독립된 Firebase UID 생성 → 기기 간 데이터 동기화 불가
- 다른 기기에서 앱 설치 시 별도의 익명 계정이 생성됨
- 이는 Firebase 익명 인증의 본질적 한계로, Google 계정 연동 후에만 멀티 디바이스 동기화 가능
- **대응:** 별도 처리 없이 허용. 계정 연동 유도로 자연스럽게 해결

### 8.3 iOS 심사

- Apple은 게스트/익명 로그인을 오히려 권장 (Apple Review Guideline 4.8)
- 익명 사용자에게도 "계정 삭제" 기능 제공 필요 (기존 withdraw API 활용)
- 유료 기능 접근 시 구매 복원 불가 문제 → 현재 FREE/PREMIUM 구분이 있으므로, ANONYMOUS + PREMIUM 조합 시 연동 유도 필요

---

## 9. 구현 순서 (권장)

### Phase 1: 게스트 로그인 (기본 인프라)

1. `@react-native-firebase/auth` 설치 및 EAS Build
2. `src/services/firebase/auth.ts` 작성
3. `src/shared/types/api.ts` 타입 추가
4. `src/features/auth/api/authApi.ts` API 함수 추가
5. `src/features/auth/hooks/useAnonymousLogin.ts` 작성
6. `src/shared/stores/useAuthStore.ts` logout에 Firebase signOut 추가
7. `src/app/(auth)/login.tsx` 게스트 버튼 추가
8. i18n 키 추가
9. 테스트: 게스트 로그인 → 메인 화면 이동 → 로그아웃

### Phase 2: Google 계정 연동

1. `src/features/auth/hooks/mutations/useLinkGoogleMutations.ts` 작성
2. `src/features/auth/components/LinkGoogleButton.tsx` 작성
3. `src/app/(tabs)/settings.tsx` 익명 사용자 UI 추가
4. i18n 키 추가
5. 테스트: 게스트 → 설정 → Google 연동 → 정보 갱신 확인
