import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'blue' | 'lavender' | 'green' | 'white';

// 액센트 색상별 값 정의
export const ACCENT_COLORS = {
  blue: {
    primary: '#4A90E2',
    primaryHover: '#3A7BC8',
    background: '#F0F7FF',
    textOnPrimary: '#FFFFFF',
    like: '#4A90E2',
    // 다크모드
    primaryDark: '#5BA3F5',
    primaryHoverDark: '#4A90E2',
    backgroundDark: '#1C1C1E',
    textOnPrimaryDark: '#FFFFFF',
    likeDark: '#5BA3F5',
  },
  lavender: {
    primary: '#A78BFA',
    primaryHover: '#9775F0',
    background: '#F3E8FF',
    textOnPrimary: '#FFFFFF',
    like: '#A78BFA',
    // 다크모드
    primaryDark: '#B79BFF',
    primaryHoverDark: '#A78BFA',
    backgroundDark: '#1C1C1E',
    textOnPrimaryDark: '#FFFFFF',
    likeDark: '#B79BFF',
  },
  green: {
    primary: '#52B788',
    primaryHover: '#45A078',
    background: '#ECFDF5',
    textOnPrimary: '#FFFFFF',
    like: '#52B788',
    // 다크모드
    primaryDark: '#62C798',
    primaryHoverDark: '#52B788',
    backgroundDark: '#1C1C1E',
    textOnPrimaryDark: '#FFFFFF',
    likeDark: '#62C798',
  },
  white: {
    primary: '#2D3436',
    primaryHover: '#1D2426',
    background: '#FFFFFF',
    textOnPrimary: '#FFFFFF',
    like: '#FF6B6B',
    // 다크모드 (흰색 테마는 다크모드에서 반전)
    primaryDark: '#FFFFFF',
    primaryHoverDark: '#E0E0E0',
    backgroundDark: '#1C1C1E',
    textOnPrimaryDark: '#2D3436',
    likeDark: '#FF6B6B',
  },
} as const;

interface ThemeState {
  mode: ThemeMode;
  accentColor: AccentColor;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setAccentColor: (color: AccentColor) => void;
}

// 현재 테마 모드와 액센트 색상에 따른 색상값 가져오기
export function getAccentColors(mode: ThemeMode, accentColor: AccentColor) {
  const colors = ACCENT_COLORS[accentColor];
  const isDark = mode === 'dark';
  return {
    primary: isDark ? colors.primaryDark : colors.primary,
    primaryHover: isDark ? colors.primaryHoverDark : colors.primaryHover,
    background: isDark ? colors.backgroundDark : colors.background,
    textOnPrimary: isDark ? colors.textOnPrimaryDark : colors.textOnPrimary,
    like: isDark ? colors.likeDark : colors.like,
  };
}

// 첫 실행(persist 없음) 시 시스템 다크모드 설정을 따라감.
// 이미 사용자가 명시적으로 토글한 적이 있으면 persist 값이 우선됨.
const initialMode: ThemeMode = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: initialMode,
      accentColor: 'blue',
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set({ mode: get().mode === 'light' ? 'dark' : 'light' }),
      setAccentColor: (accentColor) => set({ accentColor }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
