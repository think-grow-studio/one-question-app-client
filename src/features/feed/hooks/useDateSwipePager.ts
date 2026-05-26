import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

interface UseDateSwipePagerOptions {
  /** 손가락을 왼쪽으로 미는 swipe — 다음 페이지 (예: 다음 날). */
  onNext: () => void;
  /** 손가락을 오른쪽으로 미는 swipe — 이전 페이지 (예: 이전 날). */
  onPrev: () => void;
  /** 다음 방향으로 이동 가능 여부. false 면 저항감만 주고 페이지 이동 X. */
  canGoNext: boolean;
  /** 이전 방향으로 이동 가능 여부. */
  canGoPrev: boolean;
}

// 화면 너비의 25% 이상 끌면 페이지 전환 확정.
const SWIPE_THRESHOLD_RATIO = 0.25;
const SWIPE_RESISTANCE = 0.3; // 경계 방향 swipe 시 rubber-band 저항감
const SWIPE_OUT_DURATION = 180; // ms — 이전 콘텐츠 화면 밖으로 슬라이드
const SWIPE_IN_DURATION = 200; // ms — 새 콘텐츠 슬라이드 인

/**
 * 좌/우 스와이프로 날짜(또는 다른 페이지)를 이동시키는 gesture + 슬라이드 애니메이션.
 *
 * - 슬라이드 아웃 후 반대편(viewport 밖)으로 텔레포트 → state 토글 → 슬라이드 인 패턴.
 *   UI thread(translateX) vs JS thread(React commit) frame timing 불일치로 인한
 *   1-frame 이전 콘텐츠 깜빡임을 회피.
 * - 세로 스크롤(FlashList 등)과 충돌은 `activeOffsetX` + `failOffsetY` 로 분리.
 * - 경계(canGoNext/canGoPrev false) 방향 swipe 는 0.3 배율 저항감 적용 후 spring 복귀.
 */
export function useDateSwipePager({
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
}: UseDateSwipePagerOptions): {
  gesture: ReturnType<typeof Gesture.Pan>;
  slideStyle: AnimatedStyle<ViewStyle>;
} {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          'worklet';
          let x = e.translationX;
          if (x > 0 && !canGoPrev) x = x * SWIPE_RESISTANCE;
          if (x < 0 && !canGoNext) x = x * SWIPE_RESISTANCE;
          translateX.value = x;
        })
        .onEnd((e) => {
          'worklet';
          const threshold = screenWidth * SWIPE_THRESHOLD_RATIO;
          if (e.translationX < -threshold && canGoNext) {
            translateX.value = withTiming(
              -screenWidth,
              { duration: SWIPE_OUT_DURATION },
              (finished) => {
                if (!finished) return;
                runOnJS(onNext)();
                translateX.value = screenWidth;
                translateX.value = withTiming(0, { duration: SWIPE_IN_DURATION });
              },
            );
          } else if (e.translationX > threshold && canGoPrev) {
            translateX.value = withTiming(
              screenWidth,
              { duration: SWIPE_OUT_DURATION },
              (finished) => {
                if (!finished) return;
                runOnJS(onPrev)();
                translateX.value = -screenWidth;
                translateX.value = withTiming(0, { duration: SWIPE_IN_DURATION });
              },
            );
          } else {
            translateX.value = withSpring(0);
          }
        }),
    [canGoNext, canGoPrev, onNext, onPrev, screenWidth, translateX],
  );

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { gesture, slideStyle };
}

// 호출부가 Animated.View 를 직접 알 필요 없도록 re-export (선택 사항).
export const AnimatedView = Animated.View;
