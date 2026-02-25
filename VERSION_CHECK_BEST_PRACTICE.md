# Version Check System - Best Practice 검토 및 개선 가이드

## 📅 작성일: 2025-02-02

---

## 🎯 현재 구현 상태 (v2 - "Once Per Day" 방식)

### 구현된 파일
1. **삭제**: `src/stores/useAppVersionStore.ts` (Zustand store)
2. **수정**: `src/app/_layout.tsx` (로컬 state + AsyncStorage)
3. **수정**: `src/shared/ui/VersionCheckDialog/VersionCheckDialog.tsx` (props 기반)

### 핵심 변경사항
- Zustand store 제거 → 로컬 state + AsyncStorage로 단순화
- `skippedVersion` 추적 제거 → 하루 한 번 체크 방식
- 사용자가 스킵해도 다음날 다시 표시 (UX 개선)

---

## ✅ Best Practice 검토 결과

### PROJECT_ARCHITECTURE.md 기준 평가

#### 1. State Management (Section 1.4, 7) ✅ 완벽
**규칙:**
- Zustand는 Client/UI state만
- 서버 응답 데이터는 Zustand에 저장 금지

**평가:**
- ✅ **완벽히 준수**: 이전 버전은 `latestVersion`, `minVersion` 같은 서버 데이터를 Zustand에 저장했음 (위반)
- ✅ 삭제한 것은 올바른 결정
- ✅ 현재는 로컬 state로만 관리

#### 2. Storage 사용 (Section 17.1) ✅ 적절
**규칙:**
- Sensitive data: `expo-secure-store`만 사용
- Non-sensitive data: `Zustand + AsyncStorage` OK

**평가:**
- ✅ `app_version_last_check_date`는 날짜 문자열 (non-sensitive)
- ✅ AsyncStorage 사용은 적절함
- ℹ️ 참고: Zustand persist 패턴이 더 clean하지만, 직접 사용도 OK

#### 3. UI State 관리 ✅ 적절
**규칙:**
- UI state는 로컬 또는 Zustand
- 전역 필요 여부에 따라 선택

**평가:**
- ✅ `dialogState`는 UI state → 로컬 state 사용 적절
- ✅ `_layout.tsx`에서만 사용하므로 전역 스토어 불필요

#### 4. Routing Layer (Section 4) ⚠️ 개선 필요

**규칙:**
```typescript
app/ (Routing Layer)
- ❌ No business logic
- ❌ No state management logic
- ✅ No direct API calls (OK: appVersionService 사용)
- ❌ Use hooks from features/ (현재 없음)
```

**평가:**
- ❌ **위반**: `_layout.tsx`에 비즈니스 로직 47-140줄 (약 90줄)
- ❌ **위반**: AsyncStorage 직접 사용 (state management logic)
- ❌ **위반**: 버전 체크 로직 전부 포함 (business logic)

**위반 코드:**
```typescript
// src/app/_layout.tsx (47-140줄)

// ❌ Business Logic
const getTodayDateString = () => { ... }
const wasCheckedToday = async () => { ... }
const saveCheckDate = async () => { ... }

// ❌ Complex Business Logic (40+ lines)
useEffect(() => {
  const checkAppVersion = async () => {
    // 날짜 체크 로직
    // API 호출
    // 조건 판단 (server_down, force_update, optional_update)
    // AsyncStorage 저장
  }
  checkAppVersion()
}, [])
```

---

## 📊 전체 평가

| 항목 | 상태 | Best Practice 준수 |
|------|------|-------------------|
| Zustand 스토어 제거 | ✅ | 100% 준수 |
| AsyncStorage 사용 | ✅ | 적절함 |
| 로컬 state 사용 | ✅ | 적절함 |
| `_layout.tsx` 비즈니스 로직 | ⚠️ | **위반** (개선 필요) |
| **전체 점수** | **80/100** | **Small project에서는 실용적** |

---

## 🔧 개선 방안 (Best Practice 100% 준수)

### 목표 구조

```
services/
├─ appVersionService.ts      # ✅ 이미 존재 (API 호출만)
└─ versionCheckService.ts    # 🆕 추가 (체크 로직 + AsyncStorage)

hooks/
└─ useVersionCheck.ts         # 🆕 추가 (React hook)

app/
└─ _layout.tsx                # ✅ 단순화 (훅만 사용)
```

---

## 📝 Step-by-Step 리팩토링 가이드

### Step 1: Service Layer 생성

**파일:** `src/services/versionCheckService.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appVersionService } from './appVersionService';
import { meetsMinVersion, hasNewerVersion } from './versionComparator';
import { config } from '@/constants/config';

const VERSION_CHECK_STORAGE_KEY = 'app_version_last_check_date';

export type VersionCheckType = 'force_update' | 'optional_update' | 'server_down';

export interface VersionCheckResult {
  shouldShow: boolean;
  type: VersionCheckType | null;
  latestVersion: string;
}

class VersionCheckService {
  /**
   * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
   */
  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * 오늘 이미 버전 체크를 했는지 확인
   */
  async wasCheckedToday(): Promise<boolean> {
    try {
      const lastCheckDate = await AsyncStorage.getItem(VERSION_CHECK_STORAGE_KEY);
      if (!lastCheckDate) return false;

      const today = this.getTodayDateString();
      return lastCheckDate === today;
    } catch (error) {
      console.warn('[Version Check] Failed to read last check date:', error);
      return false;
    }
  }

  /**
   * 오늘 날짜를 저장 (체크 완료 표시)
   */
  async saveCheckDate(): Promise<void> {
    try {
      const today = this.getTodayDateString();
      await AsyncStorage.setItem(VERSION_CHECK_STORAGE_KEY, today);
      console.log('[Version Check] Saved check date:', today);
    } catch (error) {
      console.warn('[Version Check] Failed to save check date:', error);
    }
  }

  /**
   * 버전 체크 수행
   * - 오늘 이미 체크했으면 스킵
   * - 서버 상태 확인 → 강제 업데이트 확인 → 선택적 업데이트 확인
   * - 결과에 따라 다이얼로그 표시 여부 결정
   */
  async checkVersion(): Promise<VersionCheckResult> {
    try {
      // 1. Check if already checked today
      const checkedToday = await this.wasCheckedToday();
      if (checkedToday) {
        console.log('[Version Check] Already checked today, skipping');
        return { shouldShow: false, type: null, latestVersion: '' };
      }

      // 2. Perform version check
      const result = await appVersionService.checkVersion();

      console.log('[Version Check]', {
        currentVersion: config.appVersion,
        serverResponse: result,
        meetsMin: meetsMinVersion(config.appVersion, result.minVersion),
        hasNewer: hasNewerVersion(config.appVersion, result.latestVersion),
      });

      // 3. Determine dialog type (priority order)

      // Priority 1: Server down
      if (!result.serverLive) {
        console.log('[Version Check] -> server_down');
        return {
          shouldShow: true,
          type: 'server_down',
          latestVersion: result.latestVersion,
        };
        // Don't save check date - will check again on next launch
      }

      // Priority 2: Force update
      if (!meetsMinVersion(config.appVersion, result.minVersion)) {
        console.log('[Version Check] -> force_update');
        return {
          shouldShow: true,
          type: 'force_update',
          latestVersion: result.latestVersion,
        };
        // Don't save check date - will check again on next launch
      }

      // Priority 3: Optional update
      if (hasNewerVersion(config.appVersion, result.latestVersion)) {
        console.log('[Version Check] -> optional_update');
        await this.saveCheckDate(); // Save check date
        return {
          shouldShow: true,
          type: 'optional_update',
          latestVersion: result.latestVersion,
        };
      }

      console.log('[Version Check] -> no update needed');
      await this.saveCheckDate(); // Save check date
      return { shouldShow: false, type: null, latestVersion: '' };

    } catch (error) {
      console.warn('[Version Check] Failed:', error);
      return { shouldShow: false, type: null, latestVersion: '' };
    }
  }
}

export const versionCheckService = new VersionCheckService();
```

**책임:**
- ✅ Infrastructure layer (PROJECT_ARCHITECTURE.md Section 6)
- ✅ AsyncStorage 직접 관리
- ✅ 비즈니스 로직 캡슐화
- ✅ 테스트 가능한 구조

---

### Step 2: Custom Hook 생성

**파일:** `src/hooks/useVersionCheck.ts`

```typescript
import { useState, useEffect } from 'react';
import { versionCheckService, VersionCheckType } from '@/services/versionCheckService';

interface VersionCheckDialogState {
  visible: boolean;
  type: VersionCheckType | null;
  latestVersion: string;
}

/**
 * 앱 시작 시 버전 체크를 수행하고 다이얼로그 상태를 관리하는 훅
 *
 * @returns dialogState - 다이얼로그 표시 상태
 * @returns closeDialog - 다이얼로그 닫기 함수
 *
 * @example
 * const { dialogState, closeDialog } = useVersionCheck();
 *
 * <VersionCheckDialog
 *   visible={dialogState.visible}
 *   type={dialogState.type}
 *   latestVersion={dialogState.latestVersion}
 *   onClose={closeDialog}
 * />
 */
export function useVersionCheck() {
  const [dialogState, setDialogState] = useState<VersionCheckDialogState>({
    visible: false,
    type: null,
    latestVersion: '',
  });

  useEffect(() => {
    const checkVersion = async () => {
      const result = await versionCheckService.checkVersion();

      if (result.shouldShow) {
        setDialogState({
          visible: true,
          type: result.type,
          latestVersion: result.latestVersion,
        });
      }
    };

    checkVersion();
  }, []);

  const closeDialog = () => {
    setDialogState({ visible: false, type: null, latestVersion: '' });
  };

  return {
    dialogState,
    closeDialog,
  };
}
```

**책임:**
- ✅ React hook (PROJECT_ARCHITECTURE.md Section 9)
- ✅ UI state 관리만
- ✅ Service layer 호출
- ✅ 재사용 가능

---

### Step 3: `_layout.tsx` 단순화

**파일:** `src/app/_layout.tsx`

```typescript
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar, View, ActivityIndicator, StyleSheet, Linking, Platform, BackHandler } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider, Theme } from 'tamagui';
import * as Notifications from 'expo-notifications';
import tamaguiConfig from '../../tamagui.config';
import { queryClient } from '@/services/queryClient';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { ThemeTransitionProvider } from '@/shared/ui/ThemeTransitionProvider';
import i18n from '@/locales';
import { GlobalErrorHandler } from '@/shared/error/GlobalErrorHandler';
import { AppErrorBoundary } from '@/shared/error/AppErrorBoundary';
import { VersionCheckDialog } from '@/shared/ui/VersionCheckDialog';
import { APP_STORE_URLS } from '@/constants/appStoreUrls';
import { useVersionCheck } from '@/hooks/useVersionCheck'; // 🆕

function RootLayoutNav() {
  const { mode } = useThemeStore();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // ✅ Clean: 훅만 사용, 비즈니스 로직 없음
  const { dialogState, closeDialog } = useVersionCheck();

  const rootBackgroundColor = mode === 'dark' ? '#1C1C1E' : '#FFFFFF';

  // 앱 시작 시 토큰 확인
  useEffect(() => {
    initialize();
  }, []);

  // 알림 클릭 시 홈으로 이동 (인증된 경우만)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        }
      }
    );

    return () => subscription.remove();
  }, [router, isAuthenticated]);

  // 인증 상태에 따라 리다이렉트
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // ✅ Handler functions (UI logic만)
  const handleDialogClose = () => {
    if (dialogState.type === 'optional_update') {
      closeDialog();
    }
  };

  const handleUpdate = () => {
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URLS.ios : APP_STORE_URLS.android;
    Linking.openURL(storeUrl);

    if (dialogState.type === 'optional_update') {
      closeDialog();
    }
  };

  const handleServerDownConfirm = () => {
    BackHandler.exitApp();
  };

  // 로딩 중일 때 스플래시 표시
  if (isLoading) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: rootBackgroundColor }]}>
        <ActivityIndicator size="large" color={mode === 'dark' ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: rootBackgroundColor },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="answer/index"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <GlobalErrorHandler />
      <VersionCheckDialog
        visible={dialogState.visible}
        type={dialogState.type}
        latestVersion={dialogState.latestVersion}
        onClose={handleDialogClose}
        onUpdate={handleUpdate}
        onServerDownConfirm={handleServerDownConfirm}
      />
    </>
  );
}

export default function RootLayout() {
  const { mode } = useThemeStore();
  const rootBackgroundColor = mode === 'dark' ? '#1C1C1E' : '#FFFFFF';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBackgroundColor }}>
      <AppErrorBoundary>
        <TamaguiProvider config={tamaguiConfig}>
          <Theme name={mode}>
            <ThemeTransitionProvider>
              <QueryClientProvider client={queryClient}>
                <RootLayoutNav />
              </QueryClientProvider>
            </ThemeTransitionProvider>
          </Theme>
        </TamaguiProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

**개선 효과:**
- ✅ `_layout.tsx`: 190줄 → ~140줄 (50줄 감소)
- ✅ 비즈니스 로직 완전 제거
- ✅ AsyncStorage 직접 사용 제거
- ✅ 훅만 사용 (PROJECT_ARCHITECTURE.md Section 4 준수)
- ✅ 테스트 가능한 구조

---

## 📋 비교표: Before vs After 리팩토링

| 항목 | Before (현재) | After (개선) |
|------|--------------|-------------|
| **파일 개수** | 2개 수정 | 4개 (2개 수정 + 2개 신규) |
| **코드 라인** | 190줄 (_layout.tsx) | 140줄 (_layout.tsx) + 120줄 (service) + 40줄 (hook) |
| **비즈니스 로직** | ❌ _layout.tsx에 있음 | ✅ service에 분리 |
| **AsyncStorage 직접 사용** | ❌ _layout.tsx에서 | ✅ service에 캡슐화 |
| **테스트 가능성** | ⚠️ 어려움 | ✅ 쉬움 (service, hook 각각 테스트) |
| **재사용성** | ❌ 불가능 | ✅ 가능 (hook 재사용) |
| **Best Practice** | 80/100 | 100/100 |

---

## 📅 리팩토링 시점 가이드

### 당장 리팩토링 필요 없음 ✅

**현재 상황:**
- 프로젝트 규모: Small (5-6 features)
- 팀 크기: 1-2명
- 단계: MVP

**현재 구현의 장점:**
- ✅ 작동함
- ✅ 간단함
- ✅ 빠른 개발 속도
- ✅ 파일 개수 적음

---

### 리팩토링 해야 하는 시점 ⏰

다음 중 **2개 이상** 해당될 때 리팩토링 권장:

1. **팀 확장**
   - [ ] 개발자 3명 이상

2. **코드 복잡도**
   - [ ] `_layout.tsx`가 300줄 이상
   - [ ] 버전 체크 로직을 다른 곳에서도 사용해야 함

3. **테스트 필요성**
   - [ ] 버전 체크 버그가 발생함
   - [ ] 테스트 커버리지가 필요함

4. **유지보수 어려움**
   - [ ] 버전 체크 로직 수정 시 불안함
   - [ ] 새로운 팀원이 코드 이해하기 어려워함

5. **기능 확장**
   - [ ] 버전 체크 외 다른 startup check 추가 예정
   - [ ] A/B 테스팅, 피쳐 플래그 등 추가 예정

---

## 🎯 마이그레이션 체크리스트

리팩토링 결정 시 순서대로 진행:

### Phase 1: Service Layer 분리
- [ ] `versionCheckService.ts` 생성
- [ ] 기존 로직 이동 및 테스트
- [ ] `_layout.tsx`에서 service 호출로 변경

### Phase 2: Hook 분리
- [ ] `useVersionCheck.ts` 생성
- [ ] `_layout.tsx` 단순화
- [ ] 동작 확인

### Phase 3: 테스트 추가 (선택)
- [ ] `versionCheckService.test.ts` 작성
- [ ] `useVersionCheck.test.ts` 작성

### Phase 4: 문서 업데이트
- [ ] 이 문서 업데이트 (완료 체크)
- [ ] `IMPLEMENTATION_SUMMARY.md` 업데이트

---

## 💡 추가 최적화 옵션 (Advanced)

### Option A: Feature-based Structure

더 큰 프로젝트로 성장 시:

```
features/version-check/
├─ services/
│  └─ versionCheckService.ts
├─ hooks/
│  └─ useVersionCheck.ts
├─ components/
│  └─ VersionCheckDialog.tsx    # 기존 shared/ui/에서 이동
├─ types/
│  └─ index.ts
└─ index.ts                      # Barrel export
```

**언제:**
- 버전 체크 관련 파일이 5개 이상
- 독립적인 기능으로 관리하고 싶을 때

---

### Option B: Zustand Persist 패턴

AsyncStorage 직접 사용 대신:

```typescript
// stores/versionCheckStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VersionCheckState {
  lastCheckDate: string | null;
  setLastCheckDate: (date: string) => void;
}

export const useVersionCheckStore = create<VersionCheckState>()(
  persist(
    (set) => ({
      lastCheckDate: null,
      setLastCheckDate: (date) => set({ lastCheckDate: date }),
    }),
    {
      name: 'version-check-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**장점:**
- ✅ Zustand persist 패턴 (PROJECT_ARCHITECTURE.md Section 13.2)
- ✅ AsyncStorage 추상화
- ✅ 타입 안전성

**단점:**
- ❌ 오버엔지니어링 (단순 날짜 저장에는 과함)
- ❌ 파일 하나 더 추가

**언제:**
- 저장할 데이터가 3개 이상
- 다른 곳에서도 날짜 접근 필요

---

## 📖 참고 자료

### PROJECT_ARCHITECTURE.md 관련 섹션

- **Section 1.4**: State Management (Server State vs Client State)
- **Section 4**: Routing Layer (`app/`) - 비즈니스 로직 금지
- **Section 6**: Service Layer (`services/`) - Infrastructure concerns
- **Section 7**: State Stores (`stores/`) - Client/UI state only
- **Section 9**: Hooks (`hooks/`) - Reusable logic
- **Section 13.2**: Zustand with Persistence
- **Section 17.1**: Security - Token Storage
- **Section 22.1**: Small Project Structure

---

## ✅ 결론

### 현재 상태 (v2 - "Once Per Day")
- **평가**: 80/100
- **상태**: ✅ 작동함, 실용적
- **권장**: 현재 상태로 진행

### 개선 후 상태 (v3 - Best Practice)
- **평가**: 100/100
- **상태**: 완벽한 아키텍처
- **권장**: 팀 확장 또는 복잡도 증가 시 적용

### 최종 의견
> 현재 구현은 Small Project에서 **실용적이고 효과적**입니다.
> 리팩토링은 필요할 때 (위 체크리스트 참고) 진행하면 됩니다.
> 이 문서를 참고하여 점진적으로 개선하세요.

---

**문서 버전:** v1.0
**마지막 업데이트:** 2025-02-02
**작성자:** Claude Sonnet 4.5
