import { useEffect, useRef, useCallback, memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { sp, radius, fs } from '@/shared/utils/responsive';
import { LIKE_POP_MIN_COUNT } from '../constants/limits';

const DOT_R = sp(4);

// chip 오른쪽 끝 기준, 반지름 36dp, \ 방향 부채꼴 (각도 -90° 적용)
const DOTS: Array<{ tx: number; ty: number; d1: number; d2: number; d3: number }> = [
  { tx: -18, ty: -31, d1: 195, d2: 135, d3: 155 }, // -120°
  { tx:   9, ty: -35, d1: 215, d2: 150, d3: 170 }, //  -75°
  { tx:  31, ty: -18, d1: 205, d2: 143, d3: 162 }, //  -30°
];

const OUT = Easing.out(Easing.cubic);
const INOUT = Easing.inOut(Easing.cubic);

interface QuestionLikePopLabelProps {
  likeCount?: number;
  triggerAnimation: boolean;
  onAnimationEnd: () => void;
}

export const QuestionLikePopLabel = memo(function QuestionLikePopLabel({
  likeCount,
  triggerAnimation,
  onAnimationEnd,
}: QuestionLikePopLabelProps) {
  const { t } = useTranslation('question');
  const accent = useAccentColors();
  const onEndRef = useRef(onAnimationEnd);
  useEffect(() => { onEndRef.current = onAnimationEnd; }, [onAnimationEnd]);

  const notifyDone = useCallback(() => { onEndRef.current?.(); }, []);

  const pos0 = useSharedValue(0);
  const pos1 = useSharedValue(0);
  const pos2 = useSharedValue(0);
  const opa = useSharedValue(0);

  const s0 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(pos0.value, [0, 1], [0, DOTS[0].tx], Extrapolation.CLAMP) },
      { translateY: interpolate(pos0.value, [0, 1], [0, DOTS[0].ty], Extrapolation.CLAMP) },
      { scale: interpolate(pos0.value, [0, 0.12, 0.65], [0, 1.3, 1.0], Extrapolation.CLAMP) },
    ],
    opacity: opa.value,
  }));
  const s1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(pos1.value, [0, 1], [0, DOTS[1].tx], Extrapolation.CLAMP) },
      { translateY: interpolate(pos1.value, [0, 1], [0, DOTS[1].ty], Extrapolation.CLAMP) },
      { scale: interpolate(pos1.value, [0, 0.12, 0.65], [0, 1.3, 1.0], Extrapolation.CLAMP) },
    ],
    opacity: opa.value,
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(pos2.value, [0, 1], [0, DOTS[2].tx], Extrapolation.CLAMP) },
      { translateY: interpolate(pos2.value, [0, 1], [0, DOTS[2].ty], Extrapolation.CLAMP) },
      { scale: interpolate(pos2.value, [0, 0.12, 0.65], [0, 1.3, 1.0], Extrapolation.CLAMP) },
    ],
    opacity: opa.value,
  }));
  useEffect(() => {
    if (!triggerAnimation || !likeCount || likeCount < LIKE_POP_MIN_COUNT) return;

    pos0.value = 0; pos1.value = 0; pos2.value = 0;
    opa.value = 0;

    const seq = (d: typeof DOTS[0]) =>
      withSequence(
        withTiming(1,    { duration: d.d1, easing: OUT }),
        withTiming(0.5,  { duration: d.d2, easing: INOUT }),
        withTiming(1,    { duration: d.d3, easing: OUT }),
      );

    pos0.value = seq(DOTS[0]);
    pos1.value = seq(DOTS[1]);
    pos2.value = seq(DOTS[2]);

    // 모든 움직임이 끝난 뒤 페이드아웃
    opa.value = withSequence(
      withTiming(1, { duration: 40 }),
      withTiming(1, { duration: 500 }),
      withTiming(0, { duration: 180 }, (finished) => {
        if (finished) runOnJS(notifyDone)();
      }),
    );
  }, [triggerAnimation]);

  if (!likeCount) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(150)}
      style={[styles.chip, { backgroundColor: `${accent.like}12` }]}
    >
      <Text style={[styles.label, { color: accent.like }]}>
        {t('likePopLabel')}
      </Text>
      <Animated.View style={[styles.dot, { backgroundColor: accent.like }, s0]} />
      <Animated.View style={[styles.dot, { backgroundColor: accent.like }, s1]} />
      <Animated.View style={[styles.dot, { backgroundColor: accent.like }, s2]} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: sp(10),
    paddingVertical: sp(5),
    borderRadius: radius(10),
    overflow: 'visible',
  },
  label: {
    fontSize: fs(12),
    ...getFontStyle('600'),
    letterSpacing: -0.2,
  },
  dot: {
    position: 'absolute',
    right: sp(4),
    top: '50%',
    marginTop: -DOT_R,
    width: DOT_R * 2,
    height: DOT_R * 2,
    borderRadius: DOT_R,
  },
});
