# 📐 Frontend Architecture Specification

This document defines the **frontend technical stack**,
**project architecture**, and **implementation rules**.

Product / business planning is intentionally excluded.
This document is written to guide **AI-assisted frontend implementation**.

---

## ⚡ Quick Start - Choose Your Scale

**🟢 Small Project (< 10 features, 1-2 devs) → Recommended for "오늘의 질문"**
- **Tech Stack**: Expo SDK 54 + React Native 0.81 + New Architecture
- **Feature structure**: api/, hooks/, components/, types/ (Section 5.1)
- **간단한 feature**: api.ts, hooks.ts만 (Section 5.2)
- Skip: Barrel exports, Slices, request/response 분리, Extensive testing
- Focus: MVP 속도 + 확장 가능성

**🟡 Medium Project (10-20 features, 3-5 devs)**
- Add: Barrel exports, request/response/store 타입 분리 (Section 22.2)
- Upgrade when: 100+ users or 3+ developers

**🔴 Large Project (20+ features, 5+ devs)**
- Full architecture with slices and comprehensive testing (Section 22.3)

**This project's estimated scale: 🟢 Small (7 features, ~6 screens, ~125 files)**

**Required Setup:**
- New Architecture enabled (see Section 1.8)
- All libraries use latest stable versions (2025)

### 핵심 차이점 (vs 단일 파일 구조)

```
❌ Old (모든 게 한 파일):
features/question/
├─ api.ts        # 모든 API 함수
├─ hooks.ts      # 모든 훅
└─ types.ts      # 모든 타입

✅ New (확장 가능한 구조):
features/question/
├─ api/
│  └─ questionApi.ts
├─ hooks/
│  ├─ queries/
│  └─ mutations/
├─ types/
│  ├─ api.ts
│  └─ store.ts
└─ components/
```

**Why?**
- ✅ 나중에 request/response 분리하기 쉬움
- ✅ 파일 찾기 쉬움 (queries vs mutations 명확)
- ✅ Medium으로 확장 시 리팩토링 최소화
- ❌ 복잡도는 거의 동일 (파일 개수만 늘어남)

---

## 1. Technical Stack (Final – Stable, 2025)

### 1.1 Platform

- React Native + Expo
- Expo SDK 54 (React Native 0.81)
- Managed Workflow
- **New Architecture Enabled** (required for modern libraries)
- Mobile-first (iOS / Android)
- **Android baseline**: Development / QA는 Android (Pixel 7/8, API 34 기준)에서 먼저 검증하고, 동일 기능을 iOS 시뮬레이터에서도 반드시 확인한다.
- **Responsive layouts**: 모든 화면은 360–420 dp 폭에서 깨지지 않아야 하며, `Dimensions`/`useWindowDimensions` 또는 Tamagui responsive props로 패딩·그리드를 조절한다.
- Web support via Expo Web (`react-native-web`)

---

### 1.2 Language

- TypeScript
- `strict: true`

---

### 1.3 Navigation

- Expo Router (v4+)
- File-based routing
- Internally based on React Navigation v7.1+

Rules:

- Navigation must be defined **only** via the `app/` directory
- Do not manually configure React Navigation unless unavoidable

---

### 1.4 State Management

#### Server State

- TanStack Query v5.84+

Usage:

- Remote API data
- Caching / refetching / pagination

Rules:

- All server data must be handled by TanStack Query
- Do NOT store server responses in Zustand

---

#### Client / UI State

- Zustand v5.0.8+

Usage:

- UI state (modals, flags)
- Local selections
- Minimal auth/session state

Rules:

- Client-only state only
- No API response objects

---

### 1.5 UI System

- Tamagui (latest stable)

Usage scope:

- Layout
- Spacing
- Typography
- Theme / tokens

Rules:

- Prefer Tamagui for shared UI
- Heavy gestures or lists should use native RN components

---

### 1.6 Performance & Interaction

- Lists: `@shopify/flash-list` v2.2+ (New Architecture required)
- Bottom Sheet: `@gorhom/bottom-sheet` v5.2+ — **현재 미사용** (자세한 이유는 [`docs/decisions/0001-bottom-sheet-pattern.md`](./docs/decisions/0001-bottom-sheet-pattern.md) 참고). 모든 sheet/dialog는 RN `<Modal>` + visible-gate 패턴으로 통일됨.
- Secure Storage: `expo-secure-store`
- Gestures: `react-native-gesture-handler` v2.20+
- Animations: `react-native-reanimated` v4.1+ (New Architecture required)

Optional animation libraries:

- Moti v0.30+: Declarative animations (built on Reanimated)
- Lottie `lottie-react-native` v7+: Complex designer-made animations

Platform notes:

- Web may replace FlashList / BottomSheet with simpler UI
- Platform branching must be minimal and isolated
- **All performance libraries require New Architecture**

---

### 1.7 Internationalization (i18n)

- i18next v25.7+
- react-i18next v16.0+
- expo-localization

Supported languages:

- English (en) – Primary development language
- Korean (ko)

Usage:

- All user-facing text must be externalized
- Default language: English
- Device language detection via `expo-localization`

Rules:

- Never hardcode user-facing strings in components
- All translations must be stored in `src/locales/`
- Use TypeScript for type-safe translation keys

---

### 1.8 React Native New Architecture

**Status: ENABLED (Required for this project)**

The React Native New Architecture is enabled by default in this project. This provides:

Benefits:
- ✅ Better performance (UI thread animations, faster bridge)
- ✅ Access to modern libraries (Reanimated 4, FlashList 2.x)
- ✅ Future-proof codebase
- ✅ Improved type safety with TurboModules
- ✅ Concurrent rendering support

Requirements:
- Expo SDK 54+
- React Native 0.81+
- All native dependencies must support New Architecture

Libraries that require New Architecture:
- `react-native-reanimated` v4+
- `@shopify/flash-list` v2+
- Modern gesture handling features

**Configuration:**

```javascript
// app.config.js
export default {
  expo: {
    // ...
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            newArchEnabled: true,
          },
          android: {
            newArchEnabled: true,
          },
        },
      ],
    ],
  },
}
```

**Installation:**

```bash
npx expo install expo-build-properties
```

---

## 2. HTTP / API Layer

### 2.1 HTTP Client

- **Axios (standard choice)**

Reasons:

- Request / response interceptors
- Token injection
- Unified error handling
- Excellent compatibility with TanStack Query
- Works identically across Mobile and Web

---

### 2.2 API Client Rules

- All HTTP requests must go through a centralized client
- Direct `fetch` usage is NOT allowed
- Token handling must be done via interceptors

---

### 2.3 Example Structure

services/
├─ apiClient.ts        # Axios instance + interceptors
├─ queryClient.ts      # TanStack Query config
├─ storage.ts          # AsyncStorage wrapper
├─ tokenRefreshService.ts  # Token refresh logic
├─ appVersionService.ts    # App version check
├─ appReview.ts        # App store review wrapper
└─ firebase/           # Analytics & crashlytics

---

## 3. Project Folder Architecture

### 3.1 Root Structure

src/
├─ app/           # Routing & screens (Expo Router only)
├─ features/      # Domain-based logic (each feature owns its stores, services, etc.)
├─ services/      # Infrastructure only (apiClient, queryClient, storage, firebase)
├─ shared/        # Cross-cutting concerns used by 2+ features
│  ├─ stores/     # Global Zustand stores (theme, auth, language, apiError)
│  ├─ types/      # Global TypeScript types (API contracts)
│  ├─ utils/      # Global utilities (responsive, date, versionComparator)
│  ├─ ui/         # Shared UI components
│  ├─ icons/      # Icon components
│  ├─ theme/      # Theme config
│  ├─ layout/     # Layout components (Screen)
│  ├─ hooks/      # Cross-feature reusable hooks
│  └─ error/      # Error boundary & global error handler
├─ constants/     # App-wide constants (config, appStoreUrls)
├─ locales/       # i18n translations
└─ assets/        # Images, icons, fonts

---

## 4. Routing Layer (`app/`)

Purpose:

- Screen composition
- Navigation structure

Rules:

- No business logic
- No direct API calls
- No state management logic
- Use hooks from `features/`

Example:
app/
├─ \_layout.tsx
├─ (auth)/
│ └─ login.tsx
├─ (tabs)/
│ ├─ today.tsx
│ ├─ collection.tsx
│ └─ profile.tsx
├─ question/
│ └─ [id].tsx
└─ modal/
└─ category.tsx

yaml
코드 복사

---

## 5. Feature Layer (`features/`)

Purpose:

- Encapsulate domain-specific frontend logic

### 5.1 Recommended Structure (Scalable Small)

**Purpose**: 처음부터 파일을 분리해두면 나중에 Medium/Large로 확장하기 쉽습니다.

```
features/<feature-name>/
├─ api/
│  └─ <feature>Api.ts           # API 호출 함수들
├─ hooks/
│  ├─ queries/
│  │  └─ use<Feature>Queries.ts # useQuery 훅
│  └─ mutations/
│     └─ use<Feature>Mutations.ts # useMutation 훅
├─ stores/
│  └─ use<Feature>Store.ts      # Zustand store (필요시)
├─ components/
│  ├─ <Feature>List.tsx         # 리스트 컴포넌트
│  ├─ <Feature>Item.tsx         # 아이템 컴포넌트
│  └─ <Feature>Form.tsx         # 폼 컴포넌트
├─ types/
│  ├─ api.ts                    # API request/response 타입
│  └─ store.ts                  # Store 타입 (필요시)
└─ utils/                       # (optional)
   └─ <feature>Utils.ts         # 유틸리티 함수
```

**Example: Question Feature**
```
features/question/
├─ api/
│  └─ questionApi.ts
│     export const questionApi = {
│       fetchDaily: async () => {...},
│       fetchById: async (id: string) => {...},
│       create: async (data: CreateQuestionRequest) => {...},
│     }
├─ hooks/
│  ├─ queries/
│  │  └─ useQuestionQueries.ts
│  │     export const useDailyQuestionQuery = () => useQuery(...)
│  └─ mutations/
│     └─ useQuestionMutations.ts
│        export const useCreateQuestionMutation = () => useMutation(...)
├─ stores/
│  └─ useQuestionFormStore.ts
│     export const useQuestionFormStore = create<QuestionFormStore>(...)
├─ components/
│  ├─ QuestionCard.tsx
│  ├─ QuestionList.tsx
│  └─ QuestionAnswerForm.tsx
├─ types/
│  ├─ api.ts
│  │  export interface QuestionResponse {...}
│  │  export interface CreateQuestionRequest {...}
│  └─ store.ts
│     export interface QuestionFormState {...}
└─ utils/
   └─ questionUtils.ts
      export const formatQuestionDate = (date: Date) => {...}
```

---

### 5.2 Alternative: Minimal Structure (단순한 Feature용)

**When to use**: 매우 간단한 기능 (3개 이하의 파일)

```
features/<feature-name>/
├─ api.ts           # 모든 API 함수
├─ hooks.ts         # 모든 Query/Mutation 훅
└─ components/      # UI 컴포넌트만
```

**Example: Settings Feature**
```
features/settings/
├─ api.ts           # 2-3개 API 함수만
├─ hooks.ts         # 2-3개 훅만
└─ components/
   └─ SettingsList.tsx
```

---

### 5.3 Migration Path (확장 시나리오)

**Phase 1: Small → Medium (10+ features 도달 시)**

Before:
```
types/
├─ api.ts           # 모든 도메인의 타입
└─ index.ts
```

After:
```
features/question/
└─ types/
   ├─ request.ts    # API 요청 타입만
   ├─ response.ts   # API 응답 타입만
   └─ store.ts
```

**Phase 2: Medium → Large (20+ features 도달 시)**

Before:
```
features/question/
└─ api/
   └─ questionApi.ts  # 모든 API 함수
```

After:
```
features/question/
└─ api/
   ├─ dailyApi.ts     # 일별 질문 API
   ├─ collectionApi.ts # 도감 API
   └─ communityApi.ts  # 커뮤니티 API
```

---

### 5.4 Rules

1. **API Layer** (`api/`):
   - HTTP 호출만
   - 타입 명시 필수
   - 비즈니스 로직 금지

2. **Hooks Layer** (`hooks/`):
   - Queries: 데이터 조회 (GET)
   - Mutations: 데이터 변경 (POST/PUT/DELETE)
   - 캐시 무효화 처리

3. **Stores Layer** (`stores/`):
   - 클라이언트 상태만
   - 서버 데이터 저장 금지
   - 필요한 feature만 생성

4. **Components Layer** (`components/`):
   - Feature 전용 UI
   - 공통 컴포넌트는 `shared/ui/`에

5. **Types Layer** (`types/`):
   - Small: api.ts + store.ts
   - Medium: request.ts + response.ts + store.ts
   - Large: params.ts 추가

6. **Utils Layer** (`utils/`):
   - 순수 함수만
   - Feature 전용 헬퍼
   - 공통 유틸은 `shared/utils/`에

---

## 6. Service Layer (`services/`)

Purpose:

- **Infrastructure-level concerns only**
- Business logic services belong in their respective `features/*/services/`

**Current Structure:**
```
services/
├─ apiClient.ts           # Axios instance + interceptors + token injection
├─ queryClient.ts         # TanStack Query config
├─ storage.ts             # AsyncStorage wrapper
├─ tokenRefreshService.ts # Token refresh with mutex
├─ appVersionService.ts   # App version check API
├─ appReview.ts           # expo-store-review wrapper
└─ firebase/
   ├─ firebaseApp.ts      # Firebase initialization
   ├─ analytics.ts        # Event tracking
   ├─ crashlytics.ts      # Error reporting
   └─ index.ts
```

**Feature-level services (business logic):**
```
features/settings/services/
└─ notifications.ts       # Notification scheduling & permissions
```

Responsibilities:

- Base URL configuration
- Auth headers
- Token refresh handling
- Axios interceptors

Rules:

- Features must use `apiClient`
- No direct `fetch` usage outside this layer
- Keep services focused (< 100 lines each)
- **Infrastructure** (used by multiple features) → `services/`
- **Business logic** (used by single feature) → `features/*/services/`

---

## 7. State Stores (Zustand)

Stores are organized by scope — **not in a single top-level directory**.

**Cross-cutting stores** (`shared/stores/`) — used by 3+ modules across features, services, and shared:
```
shared/stores/
├─ useThemeStore.ts        # Theme mode & accent color
├─ useAuthStore.ts         # Auth state (login, logout, init)
├─ useLanguageStore.ts     # Language/locale state
└─ useApiErrorStore.ts     # Global API error display
```

**Feature-local stores** — used only within a single feature:
```
features/answer/stores/
└─ useAppReviewStore.ts    # App review prompt flow

features/settings/stores/
└─ useNotificationStore.ts # Notification settings

features/question/stores/
├─ useDatePickerStore.ts   # Date picker state
└─ useSlideDirectionStore.ts # Slide animation direction
```

Rules:

- Client/UI state only
- No server data
- Keep stores small and focused
- **Single-consumer store** → `features/*/stores/`
- **Cross-cutting store** (used by services, shared, or 3+ features) → `shared/stores/`

---

## 8. Shared Layer (`shared/`)

Purpose:

- Cross-cutting concerns used by **2+ features or infrastructure**

Structure:
```
shared/
├─ stores/       # Global Zustand stores (see Section 7)
├─ types/        # Global TypeScript types (API contracts)
│  └─ api.ts
├─ utils/        # Global utilities
│  ├─ responsive.ts       # Responsive scaling (hs, vs, ms, fs, sp)
│  ├─ date.ts             # Date formatting
│  └─ versionComparator.ts # Semantic version comparison
├─ ui/           # Shared UI components
│  ├─ Button.tsx
│  ├─ Text.tsx
│  ├─ AlertDialog/
│  ├─ QuestionCard/
│  ├─ ScreenHeader/
│  └─ ...
├─ icons/        # Icon components (SVG-based)
├─ layout/       # Layout components
│  └─ Screen.tsx
├─ hooks/        # Cross-feature reusable hooks
│  └─ useThrottledCallback.ts
├─ theme/        # Theme configuration
│  └─ useAccentColors.ts
└─ error/        # Error handling
   ├─ AppErrorBoundary.tsx
   └─ GlobalErrorHandler.tsx
```

Rules:

- Shared components must be platform-agnostic
- Feature-specific UI belongs in `features/*/components`
- Only add to `shared/` when used by 2+ features — not preemptively

---

## 9. Hooks (`shared/hooks/`)

Purpose:

- Cross-feature reusable logic (lives inside `shared/`)

Rules:

- No domain-specific logic
- No direct API calls
- Feature-specific hooks belong in `features/*/hooks/`

---

## 10. Platform Compatibility Rules

- Mobile-first design
- Avoid `Platform.OS` branching unless unavoidable
- Platform-specific code must be isolated
- Web compatibility should not break mobile behavior

---

## 11. Implementation Constraints

Do NOT:

- Add Redux / MobX
- Put business logic in `app/`
- Call APIs directly in UI components
- Store server data in Zustand
- Introduce additional architectural patterns
- Use React Native Animated API (use Reanimated instead)

Rules:

- All animations must use React Native Reanimated
- Use Moti only for simple declarative animations (built on Reanimated)
- Use Lottie only for decorative, non-interactive animations

---

## 12. Guiding Principles

1. Clear separation of concerns
2. Feature-based architecture
3. Predictable folder structure
4. AI-readable and enforceable rules
5. Long-term maintainability

---

## 13. React Native Specific Configuration

### 13.1 TanStack Query Setup

**Required packages:**
- `@react-native-community/netinfo` OR `expo-network`

**AppState Focus Manager:**

```typescript
// services/queryClient.ts
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

// Refetch on app focus
AppState.addEventListener('change', (status) => {
  focusManager.setFocused(status === 'active')
})

// Refetch on network reconnect
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
})
```

**Screen Focus Refetch:**

```typescript
// hooks/useRefreshOnFocus.ts
import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'

export function useRefreshOnFocus(refetch: () => void) {
  useFocusEffect(
    useCallback(() => {
      refetch()
      return undefined
    }, [refetch])
  )
}
```

**Usage in screens:**
```typescript
const { data, refetch } = useQuery(...)
useRefreshOnFocus(refetch)
```

---

### 13.2 Zustand with Persistence

**Required package:**
- `@react-native-async-storage/async-storage`

**Persist Middleware Pattern:**

```typescript
// shared/stores/useAuthStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  token: string | null
  userId: string | null
  setAuth: (token: string, userId: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      setAuth: (token, userId) => set({ token, userId }),
      clearAuth: () => set({ token: null, userId: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

**Slices Pattern (ONLY for very large stores):**

⚠️ **Warning**: Only use slices if a single store exceeds 200+ lines.
For most projects, simple stores are sufficient.

```typescript
// ❌ Overkill for small projects (< 10 features)
shared/stores/slices/userSlice.ts
shared/stores/slices/settingsSlice.ts

// ✅ Better: Keep stores simple and focused
shared/stores/useAuthStore.ts   // ~50-100 lines, cross-cutting
shared/stores/useThemeStore.ts  // ~30-50 lines, cross-cutting
features/answer/stores/useAppReviewStore.ts  // ~20-30 lines, feature-local
```

**When you really need slices (>200 lines):**
```typescript
// stores/slices/userSlice.ts
export const createUserSlice = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
})

// stores/appStore.ts
import { create } from 'zustand'
import { createUserSlice } from './slices/userSlice'
import { createSettingsSlice } from './slices/settingsSlice'

export const useAppStore = create((...args) => ({
  ...createUserSlice(...args),
  ...createSettingsSlice(...args),
}))
```

---

## 14. Environment Variables

### 14.1 Structure

```
constants/
├─ config.ts      # Runtime config from app.config.js
└─ env.ts         # Type-safe env wrapper
```

### 14.2 Implementation

**app.config.js:**
```javascript
export default {
  expo: {
    // ...
    extra: {
      apiUrl: process.env.API_URL || 'https://api.example.com',
      environment: process.env.NODE_ENV || 'development',
    },
  },
}
```

**constants/config.ts:**
```typescript
import Constants from 'expo-constants'

export const config = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl as string,
  environment: Constants.expoConfig?.extra?.environment as string,
  isDev: __DEV__,
}
```

**Rules:**
- Never commit `.env` files with secrets
- Use `expo-constants` for runtime access
- Type-safe wrappers in `constants/`

---

## 15. Error Handling

### 15.1 Error Boundary

**Option 1: Simple (Recommended for MVP)**

Use a library:
```bash
npx expo install expo-error-boundary
```

```tsx
// app/_layout.tsx
import { ErrorBoundary } from 'expo-error-boundary'

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Stack />
    </ErrorBoundary>
  )
}
```

---

**Option 2: Custom (When you need more control)**

```typescript
// shared/error/ErrorBoundary.tsx
import React from 'react'
import { View, Text, Button } from 'react-native'

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Error:', error)
    // TODO: Log to Sentry/Firebase when ready
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong</Text>
          <Button title="Restart" onPress={() => this.setState({ hasError: false })} />
        </View>
      )
    }
    return this.props.children
  }
}
```

---

### 15.2 API Error Handling

**services/interceptors.ts:**
```typescript
import { AxiosError } from 'axios'

export function setupInterceptors(axiosInstance) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // Token refresh logic
      if (error.response?.status === 401) {
        // Handle token refresh
      }

      // Normalize error format
      const normalizedError = {
        message: error.response?.data?.message || 'Network error',
        status: error.response?.status,
        code: error.code,
      }

      return Promise.reject(normalizedError)
    }
  )
}
```

---

## 16. Type System Organization

### 16.1 Type Structure

**Current structure (small-to-medium):**

Global API types live in `shared/types/`, feature-specific types live in `features/*/types/`:

```
shared/types/
└─ api.ts              # Shared API contracts (request/response types used across features)

features/feed/types/
└─ api.ts              # Feed-specific types (extends shared types)

features/question/types/
└─ api.ts              # Question-specific types
```

**For larger projects (10+ features):**

```
shared/types/
├─ api/
│  ├─ auth.ts
│  ├─ question.ts
│  └─ user.ts
├─ models/
│  ├─ Question.ts
│  └─ User.ts
└─ ui/
   └─ navigation.ts
```

**Simple Example (Recommended for most projects):**
```typescript
// shared/types/api.ts
export interface QuestionResponse {
  id: string
  question_text: string
  created_at: string
}

// features/question/api/questionApi.ts
import { QuestionResponse } from '@/shared/types/api'

function transformQuestion(raw: QuestionResponse): Question {
  return {
    id: raw.id,
    text: raw.question_text,
    createdAt: new Date(raw.created_at),
  }
}
```

**Rule of thumb:**
- < 10 features → `shared/types/api.ts` (single file)
- \> 10 features → `shared/types/api/` (nested folders)

---

## 17. Security Guidelines

### 17.1 Token Storage

**Rules:**
1. **Sensitive data** (auth tokens, API keys): `expo-secure-store` ONLY
2. **Non-sensitive data** (UI preferences): Zustand + AsyncStorage OK
3. **Never** store tokens in unencrypted Zustand without persist

**Implementation:**

```typescript
// services/secureStorage.ts
import * as SecureStore from 'expo-secure-store'

export const secureStorage = {
  async setToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value)
  },

  async getToken(key: string) {
    return await SecureStore.getItemAsync(key)
  },

  async deleteToken(key: string) {
    await SecureStore.deleteItemAsync(key)
  },
}
```

```typescript
// services/storage.ts — token storage is handled via storage service
import AsyncStorage from '@react-native-async-storage/async-storage'

export const storage = {
  async getAccessToken() {
    return await AsyncStorage.getItem('accessToken')
  },
  async setAccessToken(token: string) {
    await AsyncStorage.setItem('accessToken', token)
  },
  async clear() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
  },
}
```

---

### 17.2 API Client Security

**Token injection via interceptor:**

```typescript
// services/apiClient.ts
import axios from 'axios'
import { storage } from './storage'

export const apiClient = axios.create({
  baseURL: config.apiUrl,
})

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

---

## 18. Performance Optimization

### 18.1 Component Optimization

**Rules:**
1. Use `React.memo` for components that render frequently with same props
2. `useCallback` for functions passed to child components
3. `useMemo` for expensive computations only

**When to use:**
```typescript
// ✅ Good: Memoize expensive list items
const ListItem = React.memo(({ item }) => {
  return <View>...</View>
})

// ✅ Good: Callback passed to children
const handlePress = useCallback(() => {
  navigation.navigate('Details')
}, [navigation])

// ❌ Bad: Premature optimization
const simpleValue = useMemo(() => a + b, [a, b]) // Just use a + b
```

---

### 18.2 FlashList Best Practices

**Required props:**
```tsx
import { FlashList } from '@shopify/flash-list'

<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={100}  // ✅ REQUIRED for good performance
  keyExtractor={(item) => item.id}  // ✅ REQUIRED
/>
```

**Common mistakes:**
```tsx
// ❌ Bad: Inline function recreation
<FlashList
  renderItem={({ item }) => <ItemComponent item={item} onPress={() => {}} />}
/>

// ✅ Good: Stable function reference
const renderItem = useCallback(({ item }) => (
  <ItemComponent item={item} onPress={handlePress} />
), [handlePress])

<FlashList renderItem={renderItem} ... />
```

---

### 18.3 Image Optimization

**Use Expo Image:**
- Faster than RN Image
- Built-in caching
- Blurhash support

```tsx
import { Image } from 'expo-image'

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>
```

---

## 19. Testing Strategy

⚠️ **Progressive Testing Approach**: Start minimal, add tests as needed.

### 19.1 Initial Phase (MVP)

**Priorities:**
1. ✅ Critical API functions only
2. ❌ Skip UI component tests initially
3. ❌ Skip hook tests initially
4. ❌ Skip MSW setup initially

```
__tests__/
└─ features/
   ├─ question/
   │  └─ api.test.ts    # Only critical API
   └─ auth/
      └─ api.test.ts
```

---

### 19.2 Mature Phase (Post-MVP)

**When to expand:**
- After reaching 100+ users
- When bugs become frequent
- When refactoring is needed

```
__tests__/
├─ features/      # Feature integration tests
│  └─ question/
│     ├─ api.test.ts
│     └─ hooks.test.ts
├─ services/      # Service layer tests
│  └─ apiClient.test.ts
└─ shared/        # Component tests
   └─ ui/
      └─ Button.test.tsx
```

**Testing Stack:**
- `jest` (included in Expo)
- `@testing-library/react-native`
- `msw` (add when needed)

---

### 19.3 Testing Patterns (When You Need Them)

**API Tests:**
```typescript
// __tests__/features/question/api.test.ts
import { server } from '../../mocks/server'
import { rest } from 'msw'
import { fetchQuestions } from '@/features/question/api'

describe('Question API', () => {
  it('fetches questions successfully', async () => {
    const questions = await fetchQuestions()
    expect(questions).toHaveLength(10)
  })
})
```

**Hook Tests:**
```typescript
// __tests__/features/question/hooks.test.ts
import { renderHook, waitFor } from '@testing-library/react-native'
import { useQuestions } from '@/features/question/hooks'
import { wrapper } from '../../utils/testWrapper'

describe('useQuestions', () => {
  it('loads questions', async () => {
    const { result } = renderHook(() => useQuestions(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
```

**Component Tests:**
```typescript
// __tests__/shared/ui/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '@/shared/ui/Button'

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button onPress={onPress}>Click</Button>)
    fireEvent.press(getByText('Click'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
```

---

## 20. Code Organization Patterns

### 20.1 Barrel Exports (Optional)

⚠️ **Only add if you have 10+ features or large team**

**For small projects (< 10 features):**
```typescript
// ✅ Simple: Direct imports are fine
import { useQuestions } from '@/features/question/hooks'
import { QuestionCard } from '@/features/question/components/QuestionCard'
```

**For larger projects:**

```typescript
// features/question/index.ts
// Public API only
export { useQuestions, useQuestion } from './hooks'
export { QuestionCard, QuestionList } from './components'
export type { Question } from './types'

// ❌ Do NOT export:
// - api.ts functions (internal implementation)
// - Internal component details
```

**Usage:**
```typescript
// Clean imports
import { useQuestions, QuestionCard } from '@/features/question'
```

**Trade-offs:**
- ✅ Cleaner imports
- ✅ Better encapsulation
- ❌ Extra maintenance
- ❌ Harder to navigate in small projects

---

### 20.2 Path Aliases

**tsconfig.json:**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/app/*": ["src/app/*"],
      "@/features/*": ["src/features/*"],
      "@/services/*": ["src/services/*"],
      "@/shared/*": ["src/shared/*"],
      "@/constants/*": ["src/constants/*"],
      "@/assets/*": ["src/assets/*"]
    }
  }
}
```

> Note: `@/*` covers all paths. The explicit aliases are for IDE autocompletion clarity.
> Removed aliases: `@/stores/*`, `@/types/*`, `@/utils/*`, `@/hooks/*` (directories no longer exist at top level).

---

## 21. Updated Constraints

### Additional "Do NOT" Rules:

- Use inline styles in components (use Tamagui or StyleSheet)
- Store sensitive data in AsyncStorage
- Use `any` type in TypeScript
- Create barrel exports for internal implementation details
- Skip `keyExtractor` or `estimatedItemSize` in FlashList
- Use `fetch` directly (always use apiClient)
- Put API logic in hooks (hooks compose, api.ts implements)
- Skip error boundaries in app root
- Use React Native Animated API (always use Reanimated)
- Use Lottie for interactive UI elements (Reanimated only)

### Animation Rules:

- ✅ All animations must use React Native Reanimated
- ✅ Use `useSharedValue` and `useAnimatedStyle` for all animated components
- ✅ Prefer `entering`/`exiting` props for mount/unmount animations
- ✅ Use Gesture Handler with Reanimated for gesture-based animations
- ⚠️ Optional: Use Moti for simple declarative animations (built on Reanimated)
- ⚠️ Optional: Use Lottie only for decorative, non-interactive animations

---

## 22. Project Structure by Scale

### 22.1 Small Project (< 10 features, 1-2 developers)

**Current "질문하나" structure:**

```
src/
├─ app/                      # Routing (~6 screens)
│  ├─ _layout.tsx
│  ├─ (auth)/login.tsx
│  ├─ (tabs)/
│  │  ├─ index.tsx           # Home (Today)
│  │  ├─ feed.tsx            # Public feed
│  │  └─ settings.tsx
│  ├─ answer/index.tsx
│  └─ feed/[id].tsx
├─ features/                 # 7 features
│  ├─ question/              # 질문 도메인 (largest feature)
│  │  ├─ api/
│  │  │  └─ questionApi.ts
│  │  ├─ hooks/
│  │  │  ├─ queries/
│  │  │  └─ mutations/
│  │  ├─ stores/             # Feature-local stores
│  │  ├─ components/
│  │  ├─ constants/
│  │  ├─ domain/
│  │  └─ types/
│  ├─ feed/                  # 피드 도메인
│  │  ├─ api/
│  │  ├─ hooks/
│  │  ├─ components/
│  │  ├─ types/
│  │  └─ utils/
│  ├─ answer/                # 답변 도메인
│  │  ├─ components/
│  │  ├─ hooks/
│  │  └─ stores/             # Feature-local store
│  ├─ settings/              # 설정 도메인
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ stores/             # Feature-local store
│  │  └─ services/           # Feature-local service (notifications)
│  ├─ auth/                  # 인증 (minimal)
│  │  ├─ api/
│  │  └─ hooks/
│  ├─ member/                # 회원
│  │  ├─ api/
│  │  ├─ hooks/
│  │  └─ constants/
│  └─ admob/                 # 광고
│     ├─ config/
│     └─ hooks/
├─ services/                 # Infrastructure only
│  ├─ apiClient.ts
│  ├─ queryClient.ts
│  ├─ storage.ts
│  ├─ tokenRefreshService.ts
│  ├─ appVersionService.ts
│  ├─ appReview.ts
│  └─ firebase/
├─ shared/                   # Cross-cutting concerns
│  ├─ stores/                # Global stores (theme, auth, language, apiError)
│  ├─ types/                 # Global API types
│  ├─ utils/                 # Global utilities (responsive, date, versionComparator)
│  ├─ ui/                    # Shared UI components
│  ├─ icons/                 # Icon components
│  ├─ layout/                # Screen layout
│  ├─ hooks/                 # Cross-feature hooks
│  ├─ theme/                 # Theme config
│  └─ error/                 # Error boundary & handler
├─ constants/
│  ├─ config.ts
│  └─ appStoreUrls.ts
├─ locales/                  # i18n translations (ko, en)
└─ assets/
```

**Key Points:**
1. ✅ **Feature 내부는 필요한 만큼만**: 모든 feature에 동일한 하위 폴더 강제하지 않음
2. ✅ **Store 위치는 scope로 결정**: single-consumer → feature, cross-cutting → shared
3. ✅ **services/는 인프라만**: 비즈니스 로직은 features/*/services/로
4. ✅ **shared/가 cross-cutting 허브**: stores, types, utils, ui 모두 여기에
5. ✅ **확장 가능**: 나중에 Medium으로 전환 쉬움

**What to skip initially:**
- ❌ Barrel exports (`index.ts`)
- ❌ Slices pattern
- ❌ Comprehensive testing
- ❌ Nested type folders (request/response/params 분리)

---

### 22.2 Medium Project (10-20 features, 3-5 developers)

```
src/
├─ app/
├─ features/          # 10-20 features
│  └─ <feature>/
│     ├─ api/
│     ├─ hooks/
│     ├─ components/
│     ├─ stores/      # Feature-local stores
│     ├─ services/    # Feature-local services
│     ├─ types/
│     └─ index.ts     # Add barrel exports
├─ services/          # Infrastructure only
│  ├─ apiClient.ts
│  ├─ queryClient.ts
│  ├─ storage.ts
│  └─ firebase/
├─ shared/
│  ├─ stores/         # Cross-cutting stores
│  ├─ types/          # Nested structure (api/, models/, ui/)
│  ├─ utils/
│  ├─ ui/
│  ├─ layout/
│  ├─ hooks/
│  ├─ error/
│  └─ theme/
├─ constants/
├─ locales/
├─ assets/
└─ __tests__/         # Comprehensive tests
```

**When to upgrade:**
- ✅ 100+ active users
- ✅ Team grows to 3+ developers
- ✅ Feature count exceeds 10
- ✅ Bug rate increases

---

### 22.3 Large Project (20+ features, 5+ developers)

```
src/
├─ app/
├─ features/          # 20+ features
│  └─ <feature>/
│     ├─ api/
│     ├─ hooks/
│     ├─ components/
│     ├─ stores/
│     ├─ services/
│     ├─ types/
│     └─ index.ts     # Barrel exports required
├─ services/
│  ├─ api/
│  │  ├─ client.ts
│  │  └─ interceptors.ts
│  ├─ storage/
│  │  ├─ secure.ts
│  │  └─ async.ts
│  └─ analytics/
├─ shared/
│  ├─ stores/         # Cross-cutting stores (slices pattern if >200 lines)
│  ├─ types/
│  │  ├─ api/
│  │  ├─ models/
│  │  └─ ui/
│  ├─ utils/
│  ├─ ui/
│  ├─ layout/
│  ├─ error/
│  ├─ hooks/
│  └─ theme/
├─ constants/
├─ locales/
├─ assets/
└─ __tests__/
```

---

## 23. Internationalization (i18n) Implementation

### 23.1 Folder Structure

**Small to Medium projects:**

```
src/
├─ locales/
│  ├─ en/
│  │  ├─ common.json
│  │  ├─ question.json
│  │  ├─ collection.json
│  │  └─ auth.json
│  ├─ ko/
│  │  ├─ common.json
│  │  ├─ question.json
│  │  ├─ collection.json
│  │  └─ auth.json
│  ├─ index.ts          # i18n configuration
│  └─ resources.ts      # Type-safe translation keys
├─ constants/
│  └─ languages.ts      # Supported languages config
```

**Organization by feature:**
- Each feature gets its own translation namespace
- Common UI strings go in `common.json`
- Feature-specific strings go in feature namespaces (e.g., `question.json`)

---

### 23.2 Setup & Configuration

**Install dependencies:**

```bash
npx expo install i18next react-i18next expo-localization
```

**locales/index.ts:**

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

// Import translations
import enCommon from './en/common.json'
import enQuestion from './en/question.json'
import koCommon from './ko/common.json'
import koQuestion from './ko/question.json'

const resources = {
  en: {
    common: enCommon,
    question: enQuestion,
  },
  ko: {
    common: koCommon,
    question: koQuestion,
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.locale.split('-')[0], // 'en-US' → 'en'
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    compatibilityJSON: 'v3', // Important for Android
  })

export default i18n
```

**app/_layout.tsx (Root):**

```typescript
import '../locales' // Import i18n config

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  )
}
```

---

### 23.3 Translation Files

**locales/en/common.json:**

```json
{
  "app": {
    "name": "Daily Question"
  },
  "buttons": {
    "confirm": "Confirm",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete"
  },
  "errors": {
    "network": "Network error. Please try again.",
    "unknown": "Something went wrong."
  }
}
```

**locales/en/question.json:**

```json
{
  "title": "Today's Question",
  "placeholder": "Write your answer...",
  "submit": "Submit Answer",
  "stats": {
    "answered": "{{count}} answered",
    "views": "{{count}} views"
  }
}
```

**locales/ko/question.json:**

```json
{
  "title": "오늘의 질문",
  "placeholder": "답변을 작성하세요...",
  "submit": "답변 제출",
  "stats": {
    "answered": "{{count}}명 답변",
    "views": "조회 {{count}}회"
  }
}
```

---

### 23.4 Usage in Components

**Basic usage:**

```typescript
import { useTranslation } from 'react-i18next'

export function QuestionCard() {
  const { t } = useTranslation('question')

  return (
    <View>
      <Text>{t('title')}</Text>
      <TextInput placeholder={t('placeholder')} />
      <Button>{t('submit')}</Button>
    </View>
  )
}
```

**With interpolation:**

```typescript
const { t } = useTranslation('question')

// Translation: "{{count}} answered"
<Text>{t('stats.answered', { count: 42 })}</Text>
// Output: "42 answered" (en) or "42명 답변" (ko)
```

**Multiple namespaces:**

```typescript
const { t } = useTranslation(['question', 'common'])

<Text>{t('question:title')}</Text>
<Button>{t('common:buttons.confirm')}</Button>
```

**Date/Number formatting:**

```typescript
import { useTranslation } from 'react-i18next'

const { t, i18n } = useTranslation()

// Date formatting
const date = new Date()
const formattedDate = new Intl.DateTimeFormat(i18n.language).format(date)

// Number formatting
const number = 1234567.89
const formattedNumber = new Intl.NumberFormat(i18n.language).format(number)
```

---

### 23.5 Language Switching

**Create a language store:**

```typescript
// shared/stores/useLanguageStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '@/locales'

type Language = 'en' | 'ko'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: async (lang) => {
        await i18n.changeLanguage(lang)
        set({ language: lang })
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

**Language picker component:**

```typescript
// features/settings/components/LanguagePicker.tsx
import { useLanguageStore } from '@/shared/stores/useLanguageStore'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
] as const

export function LanguagePicker() {
  const { language, setLanguage } = useLanguageStore()
  const { t } = useTranslation('common')

  return (
    <View>
      {LANGUAGES.map((lang) => (
        <Button
          key={lang.code}
          onPress={() => setLanguage(lang.code)}
          variant={language === lang.code ? 'primary' : 'outline'}
        >
          {lang.name}
        </Button>
      ))}
    </View>
  )
}
```

---

### 23.6 Type Safety (Advanced)

**Generate type-safe translation keys:**

```typescript
// locales/resources.ts
import enCommon from './en/common.json'
import enQuestion from './en/question.json'

const resources = {
  en: {
    common: enCommon,
    question: enQuestion,
  },
} as const

export default resources
```

**Extend i18next types:**

```typescript
// types/i18next.d.ts
import resources from '@/locales/resources'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: typeof resources['en']
  }
}
```

**Now you get autocomplete:**

```typescript
const { t } = useTranslation('question')

t('title') // ✅ Autocomplete works
t('invalid.key') // ❌ TypeScript error
```

---

### 23.7 Best Practices

**1. Namespace Organization:**
```
✅ Good: Feature-based namespaces
locales/en/
├─ common.json       # Shared UI strings
├─ question.json     # Question feature
├─ collection.json   # Collection feature
└─ auth.json         # Auth feature

❌ Bad: Page-based namespaces
locales/en/
├─ home.json
├─ profile.json
└─ settings.json
```

**2. Key Naming:**
```typescript
// ✅ Good: Hierarchical and descriptive
{
  "question": {
    "form": {
      "title": "Ask a Question",
      "placeholder": "Type your question..."
    }
  }
}

// ❌ Bad: Flat and unclear
{
  "questionFormTitle": "Ask a Question",
  "questionFormPlaceholder": "Type your question..."
}
```

**3. Pluralization:**
```json
// English
{
  "items": "{{count}} item",
  "items_other": "{{count}} items"
}

// Korean (no plural form)
{
  "items": "{{count}}개 항목"
}
```

Usage:
```typescript
t('items', { count: 1 })  // "1 item" (en) / "1개 항목" (ko)
t('items', { count: 5 })  // "5 items" (en) / "5개 항목" (ko)
```

**4. Never Hardcode Strings:**
```typescript
// ❌ Bad
<Text>Today's Question</Text>

// ✅ Good
<Text>{t('question:title')}</Text>
```

**5. Context for Ambiguous Words:**
```json
{
  "actions": {
    "close_button": "Close",
    "close_verb": "Close the window"
  }
}
```

---

### 23.8 Testing with i18n

**Mock i18next in tests:**

```typescript
// __tests__/utils/i18nMock.ts
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}))
```

**Test with real translations:**

```typescript
import i18n from '@/locales'
import { render } from '@testing-library/react-native'

describe('QuestionCard', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en')
  })

  it('renders title in English', () => {
    const { getByText } = render(<QuestionCard />)
    expect(getByText("Today's Question")).toBeTruthy()
  })
})
```

---

### 23.9 Migration Strategy

**Phase 1: Setup (MVP)**
1. Install dependencies
2. Configure i18n with English only
3. Create basic translation structure
4. Update 2-3 critical screens

**Phase 2: Expand (Post-MVP)**
1. Add Korean translations
2. Migrate all screens
3. Add language picker in settings

**Phase 3: Polish**
1. Add type safety
2. Add missing translations checker (CI/CD)
3. Optimize bundle size (lazy loading)

---

### 23.10 Rules Summary

**Do:**
- ✅ Use feature-based namespaces
- ✅ Externalize ALL user-facing strings
- ✅ Test in all supported languages
- ✅ Use hierarchical keys
- ✅ Provide context for translators

**Do NOT:**
- ❌ Hardcode strings in components
- ❌ Use page-based namespaces
- ❌ Forget fallback language
- ❌ Mix languages in one component
- ❌ Use `any` type for translation keys

---

## 24. Animation Strategy

### 24.1 Recommended Stack

**Primary: React Native Reanimated 4.1+**

Reasons:
- ✅ Runs on UI thread (60fps guaranteed)
- ✅ Best performance for mobile
- ✅ Official Expo support
- ✅ Industry standard in React Native
- ✅ Works seamlessly with Gesture Handler v2.20+
- ✅ Tamagui compatible
- ✅ New declarative, CSS-compatible animation API
- ⚠️ **Requires React Native New Architecture**

**Secondary: Moti v0.30+ (Optional)**

Use cases:
- Simple declarative animations
- Framer Motion-like API
- Quick prototyping
- Built on top of Reanimated

**Tertiary: Lottie v7+ (Optional)**

Use cases:
- Complex designer-made animations
- After Effects exports
- Splash screens, onboarding
- Decorative animations

---

### 24.2 Installation

**Required (always install):**

```bash
# Animation and gesture libraries (Reanimated 4 requires New Architecture)
npx expo install react-native-reanimated@~4.1.5 react-native-gesture-handler@~2.20.0
```

**Optional (install when needed):**

```bash
# Moti - for simple declarative animations
npx expo install moti@~0.30.0

# Lottie - for complex JSON animations
npx expo install lottie-react-native@~7.0.0
```

**babel.config.js:**

```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin', // ✅ MUST be last
  ],
}
```

**app.config.js (New Architecture):**

```javascript
export default {
  expo: {
    plugins: [
      [
        'expo-build-properties',
        {
          ios: { newArchEnabled: true },
          android: { newArchEnabled: true },
        },
      ],
    ],
  },
}
```

---

### 24.3 Reanimated 4 Patterns

**1. Shared Values (State)**

```typescript
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'

export function AnimatedBox() {
  const offset = useSharedValue(0)

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }))

  const handlePress = () => {
    offset.value = withSpring(offset.value + 50)
  }

  return (
    <Animated.View style={animatedStyles}>
      <Button onPress={handlePress}>Move</Button>
    </Animated.View>
  )
}
```

**2. Entering/Exiting Animations**

```typescript
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated'

export function QuestionCard() {
  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <Text>Today's Question</Text>
    </Animated.View>
  )
}
```

**3. Layout Animations**

```typescript
import Animated, { Layout } from 'react-native-reanimated'

export function AnimatedList({ items }) {
  return (
    <View>
      {items.map((item) => (
        <Animated.View key={item.id} layout={Layout.springify()}>
          <Text>{item.name}</Text>
        </Animated.View>
      ))}
    </View>
  )
}
```

**4. Gesture-based Animations**

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'

export function DraggableCard() {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  const pan = Gesture.Pan()
    .onChange((event) => {
      translateX.value += event.changeX
      translateY.value += event.changeY
    })
    .onEnd(() => {
      translateX.value = withSpring(0)
      translateY.value = withSpring(0)
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }))

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>
        <Text>Drag me!</Text>
      </Animated.View>
    </GestureDetector>
  )
}
```

---

### 24.4 Moti Patterns (Simple Animations)

**When to use Moti:**
- ✅ Simple fade/scale/translate animations
- ✅ Prototyping quickly
- ✅ Declarative API preference
- ❌ NOT for complex gestures (use Reanimated directly)

**Installation:**

```bash
npx expo install moti
```

**Examples:**

```typescript
import { MotiView } from 'moti'

// Simple fade in
export function FadeInBox() {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 500 }}
    >
      <Text>Fading in...</Text>
    </MotiView>
  )
}

// Animated presence (mount/unmount)
import { AnimatePresence } from 'moti'

export function ConditionalBox({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Text>I appear and disappear smoothly</Text>
        </MotiView>
      )}
    </AnimatePresence>
  )
}

// Loop animation
export function PulsingDot() {
  return (
    <MotiView
      from={{ scale: 1 }}
      animate={{ scale: 1.2 }}
      transition={{
        type: 'timing',
        duration: 1000,
        loop: true,
        repeatReverse: true,
      }}
      style={{ width: 10, height: 10, backgroundColor: 'red', borderRadius: 5 }}
    />
  )
}
```

---

### 24.5 Lottie Patterns (Complex Animations)

**When to use Lottie:**
- ✅ Splash screens
- ✅ Onboarding animations
- ✅ Empty states
- ✅ Loading indicators (custom)
- ❌ NOT for interactive UI elements (use Reanimated)

**Installation:**

```bash
npx expo install lottie-react-native
```

**Examples:**

```typescript
import LottieView from 'lottie-react-native'

// Simple playback
export function LoadingAnimation() {
  return (
    <LottieView
      source={require('@/assets/animations/loading.json')}
      autoPlay
      loop
      style={{ width: 200, height: 200 }}
    />
  )
}

// Controlled playback
import { useRef, useEffect } from 'react'

export function OnboardingAnimation({ isActive }) {
  const animationRef = useRef<LottieView>(null)

  useEffect(() => {
    if (isActive) {
      animationRef.current?.play()
    } else {
      animationRef.current?.pause()
    }
  }, [isActive])

  return (
    <LottieView
      ref={animationRef}
      source={require('@/assets/animations/onboarding.json')}
      loop={false}
    />
  )
}
```

**Where to get Lottie files:**
- LottieFiles.com (free and paid)
- Export from After Effects (with Bodymovin plugin)

---

### 24.6 Animation Guidelines by Use Case

**UI Feedback (buttons, interactions):**
```typescript
// ✅ Good: Reanimated for 60fps
const scale = useSharedValue(1)

const handlePressIn = () => {
  scale.value = withSpring(0.95)
}

const handlePressOut = () => {
  scale.value = withSpring(1)
}

<Animated.Pressable style={animatedStyle} onPressIn={handlePressIn} onPressOut={handlePressOut}>
  <Text>Press me</Text>
</Animated.Pressable>
```

**List items appearing:**
```typescript
// ✅ Good: Entering animations
<Animated.View entering={FadeInDown.delay(index * 100)}>
  <QuestionCard question={question} />
</Animated.View>
```

**Modals/Sheets:**
```typescript
// ✅ Good: Slide + Fade
<Animated.View
  entering={SlideInUp.springify()}
  exiting={SlideOutDown.springify()}
>
  <BottomSheet />
</Animated.View>
```

**Page transitions:**
```typescript
// ✅ Good: Use Expo Router built-in animations
// expo-router handles this automatically with screen options
```

**Loading states:**
```typescript
// ✅ Good: Simple Moti loop OR Lottie
<MotiView
  from={{ rotate: '0deg' }}
  animate={{ rotate: '360deg' }}
  transition={{ type: 'timing', duration: 1000, loop: true }}
>
  <Spinner />
</MotiView>
```

---

### 24.7 Performance Best Practices

**Do:**
- ✅ Use `useAnimatedStyle` for all animated styles
- ✅ Use `withSpring` or `withTiming` for smooth animations
- ✅ Keep animations on UI thread (Reanimated does this automatically)
- ✅ Use `entering`/`exiting` props for mount/unmount animations
- ✅ Memoize gesture handlers with `useMemo`

**Do NOT:**
- ❌ Use React Native Animated API for complex animations
- ❌ Animate during heavy renders
- ❌ Create new animated values on every render
- ❌ Use inline functions in `useAnimatedStyle`
- ❌ Overuse Lottie (bundle size impact)

**Example - Bad vs Good:**

```typescript
// ❌ Bad: Creates new value every render
export function BadAnimation() {
  const offset = useSharedValue(0) // ❌ Created on every render
  return <Animated.View />
}

// ✅ Good: Stable reference
export function GoodAnimation() {
  const offset = useSharedValue(0) // ✅ Only created once

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }))

  return <Animated.View style={animatedStyle} />
}
```

---

### 24.8 Common Animation Recipes

**1. Fade in on mount:**
```typescript
<Animated.View entering={FadeIn.duration(300)}>
  <Content />
</Animated.View>
```

**2. Staggered list:**
```typescript
{items.map((item, index) => (
  <Animated.View
    key={item.id}
    entering={FadeInDown.delay(index * 100)}
  >
    <ListItem item={item} />
  </Animated.View>
))}
```

**3. Button press feedback:**
```typescript
const scale = useSharedValue(1)

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}))

<Animated.Pressable
  style={animatedStyle}
  onPressIn={() => scale.value = withSpring(0.95)}
  onPressOut={() => scale.value = withSpring(1)}
>
  <Text>Press me</Text>
</Animated.Pressable>
```

**4. Swipe to dismiss:**
```typescript
const translateX = useSharedValue(0)

const pan = Gesture.Pan()
  .onChange((e) => translateX.value += e.changeX)
  .onEnd(() => {
    if (Math.abs(translateX.value) > 100) {
      translateX.value = withTiming(translateX.value > 0 ? 500 : -500)
      runOnJS(onDismiss)()
    } else {
      translateX.value = withSpring(0)
    }
  })

<GestureDetector gesture={pan}>
  <Animated.View style={animatedStyle}>
    <Card />
  </Animated.View>
</GestureDetector>
```

**5. Skeleton loading:**
```typescript
<MotiView
  from={{ opacity: 0.3 }}
  animate={{ opacity: 1 }}
  transition={{
    type: 'timing',
    duration: 1000,
    loop: true,
    repeatReverse: true,
  }}
  style={{ width: '100%', height: 100, backgroundColor: '#e0e0e0' }}
/>
```

---

### 24.9 Folder Organization

**Small projects:**

```
src/
├─ shared/
│  └─ animations/
│     ├─ transitions.ts    # Reusable transition configs
│     └─ gestures.ts       # Reusable gesture handlers
└─ assets/
   └─ animations/          # Lottie JSON files
      ├─ loading.json
      └─ success.json
```

**Example - transitions.ts:**

```typescript
// shared/animations/transitions.ts
import { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated'

export const transitions = {
  fadeIn: FadeIn.duration(300),
  fadeOut: FadeOut.duration(200),
  slideInRight: SlideInRight.springify(),
  slideOutLeft: SlideOutLeft.springify(),
}

// Usage
import { transitions } from '@/shared/animations/transitions'

<Animated.View entering={transitions.fadeIn}>
  <Content />
</Animated.View>
```

---

### 24.10 Testing Animated Components

**Mocking Reanimated in tests:**

```typescript
// __tests__/setup.ts
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})
```

**Testing animation behavior:**

```typescript
import { render, fireEvent } from '@testing-library/react-native'
import { AnimatedButton } from './AnimatedButton'

describe('AnimatedButton', () => {
  it('handles press interactions', () => {
    const onPress = jest.fn()
    const { getByText } = render(<AnimatedButton onPress={onPress} />)

    fireEvent.press(getByText('Press me'))
    expect(onPress).toHaveBeenCalled()
  })
})
```

---

### 24.11 Decision Tree

**Choose your animation library:**

```
Is it a complex gesture interaction?
├─ Yes → React Native Reanimated
└─ No
   └─ Is it a simple fade/scale/translate?
      ├─ Yes → Moti (easier API) OR Reanimated (better performance)
      └─ No
         └─ Is it a designer-made animation from After Effects?
            ├─ Yes → Lottie
            └─ No → React Native Reanimated
```

**Performance requirement:**
- **Critical** (60fps required): Reanimated
- **Important** (smooth enough): Moti or Reanimated
- **Decorative** (can drop frames): Lottie

---

### 24.12 Rules Summary

**Do:**
- ✅ Default to Reanimated for all interactive animations
- ✅ Use Moti for quick prototypes or simple declarative needs
- ✅ Use Lottie only for decorative, non-interactive animations
- ✅ Keep animations subtle and purposeful
- ✅ Test animations on low-end devices
- ✅ Provide reduced motion alternatives (accessibility)

**Do NOT:**
- ❌ Mix Animated API with Reanimated
- ❌ Overuse animations (less is more)
- ❌ Animate during data fetching or heavy computation
- ❌ Use Lottie for interactive UI elements
- ❌ Create animations without clear purpose
- ❌ Ignore animation performance on Android

---

### 24.13 Accessibility Considerations

**Respect reduced motion preference:**

```typescript
import { useReducedMotion } from 'react-native-reanimated'

export function AnimatedCard() {
  const reducedMotion = useReducedMotion()

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(300)}
    >
      <Content />
    </Animated.View>
  )
}
```

**Alternative for reduced motion:**

```typescript
const shouldAnimate = !useReducedMotion()

const animatedStyle = useAnimatedStyle(() => ({
  opacity: shouldAnimate ? withTiming(1) : 1,
}))
```

---

## End of Document
