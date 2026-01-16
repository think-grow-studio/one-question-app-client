import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useThemeStore } from '@/stores/useThemeStore';

// 테마별 배경색 (순수 흰/검 대신 약간 부드러운 색상)
const THEME_COLORS = {
  light: '#F8F8F8',
  dark: '#121212',
} as const;

interface ThemeTransitionContextType {
  toggleThemeWithTransition: () => void;
}

const ThemeTransitionContext = createContext<ThemeTransitionContextType | null>(
  null
);

export function useThemeTransition() {
  const context = useContext(ThemeTransitionContext);
  if (!context) {
    throw new Error(
      'useThemeTransition must be used within ThemeTransitionProvider'
    );
  }
  return context;
}

interface Props {
  children: ReactNode;
}

export function ThemeTransitionProvider({ children }: Props) {
  const { mode, toggleMode } = useThemeStore();

  const opacity = useSharedValue(0);
  const overlayColorValue = useSharedValue(mode === 'dark' ? 1 : 0);
  const lastToggleTime = useRef(0);
  const isAnimatingRef = useRef(false);

  const onAnimationComplete = useCallback(() => {
    isAnimatingRef.current = false;
  }, []);

  const toggleThemeWithTransition = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleTime.current < 800) return;
    if (isAnimatingRef.current) return;

    lastToggleTime.current = now;
    isAnimatingRef.current = true;

    const isGoingToLight = mode === 'dark';
    const duration = isGoingToLight ? 1000 : 700;

    overlayColorValue.value = mode === 'dark' ? 1 : 0;
    opacity.value = 1;
    toggleMode();

    opacity.value = withTiming(
      0,
      { duration, easing: Easing.bezier(0.4, 0, 0.2, 1) },
      (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      }
    );
  }, [mode, toggleMode, opacity, overlayColorValue, onAnimationComplete]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor:
      overlayColorValue.value === 1 ? THEME_COLORS.dark : THEME_COLORS.light,
  }));

  return (
    <ThemeTransitionContext.Provider value={{ toggleThemeWithTransition }}>
      {children}
      <Animated.View
        style={[styles.overlay, overlayStyle]}
        pointerEvents="none"
      />
    </ThemeTransitionContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
