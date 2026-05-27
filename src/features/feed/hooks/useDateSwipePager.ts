import { useCallback, useMemo, useRef, type MutableRefObject } from 'react';
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
// Pan 종료 후 Pressable.onPress 가 trailing 으로 fire 되는 iOS quirk 를 흡수할 시간.
// 짧게 잡으면 race window 가 좁아 onPress 가 새어 나가고, 길게 잡으면 정상 탭이 억제됨.
//
// TODO(gesture-composition): 이 ref + setTimeout 가드는 실용적 workaround. 진짜 best
// practice 는 자식 Pressable 을 `Gesture.Tap()` 으로 바꾸고 부모 Pan 과
// `Gesture.Race(pan, tap)` 으로 native 레벨에서 협의시키는 것. 그러면 타이밍 매직넘버
// 불필요. 다만 AnswerCard / MyAnswerCard / 좋아요 nested Pressable 등 리팩토링 범위가
// 커서 이번엔 보류. 비슷한 충돌이 다른 화면에서 또 생기면 그때 통합 정리.
const PAN_GUARD_MS = 80;

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
  /**
   * Pan 이 active 인 동안 true. swipe 도중 또는 직후 PAN_GUARD_MS 이내엔 자식
   * Pressable.onPress 가 새어나오므로 호출자가 이 ref 를 체크해 navigate 등 액션을
   * 억제할 수 있다. iOS Pressable + Pan 동시 fire quirk 회피용.
   */
  isPanActiveRef: MutableRefObject<boolean>;
} {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const isPanActiveRef = useRef(false);

  const markPanActive = useCallback(() => {
    isPanActiveRef.current = true;
  }, []);

  // onEnd 직후엔 자식 Pressable.onPress 가 trailing fire 될 가능성이 있어 잠시 더
  // active 로 유지. setTimeout 으로 guard window 종료 후 false 로 복귀.
  const schedulePanInactive = useCallback(() => {
    setTimeout(() => {
      isPanActiveRef.current = false;
    }, PAN_GUARD_MS);
  }, []);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-12, 12])
        .onStart(() => {
          'worklet';
          runOnJS(markPanActive)();
        })
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
          runOnJS(schedulePanInactive)();
        }),
    [canGoNext, canGoPrev, onNext, onPrev, screenWidth, translateX, markPanActive, schedulePanInactive],
  );

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { gesture, slideStyle, isPanActiveRef };
}

// 호출부가 Animated.View 를 직접 알 필요 없도록 re-export (선택 사항).
export const AnimatedView = Animated.View;
