import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from 'tamagui';
import { useAccentColors } from '@/shared/theme';

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_INSET = 2;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;
const DURATION_MS = 180;

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * 앱 공용 토글 스위치.
 *
 * 네이티브 Switch를 쓰지 않는 이유: iOS는 UISwitch(트랙을 꽉 채우는 알약),
 * Android는 SwitchCompat(얇은 트랙에 thumb가 위아래로 삐져나옴)이라 모양이 근본적으로
 * 다르다. 색을 아무리 맞춰도 두 플랫폼의 "켜짐" 신호 강도가 달라져서 직접 그린다.
 *
 * thumb 색은 그 아래 깔리는 트랙에 따라 갈린다 — 켜짐이면 accent.primary 위라
 * accent.textOnPrimary, 꺼짐이면 회색 트랙 위라 흰색. thumb를 흰색으로 고정하면
 * 화이트 액센트 + 다크모드에서 primary가 #FFFFFF라 켜짐이 통짜 흰 덩어리가 되고,
 * 반대로 항상 textOnPrimary를 쓰면 같은 조합의 꺼짐에서 thumb(#2D3436)가
 * borderColor(#38383A)에 묻힌다.
 */
export function AppSwitch({ value, onValueChange, disabled }: AppSwitchProps) {
  const theme = useTheme();
  const accent = useAccentColors();

  const trackOff = theme.borderColor?.val ?? '#E0E6EC';
  const trackOn = accent.primary;
  const thumbOff = '#FFFFFF';
  const thumbOn = accent.textOnPrimary;

  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [trackOff, trackOn]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
    backgroundColor: interpolateColor(progress.value, [0, 1], [thumbOff, thumbOn]),
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: THUMB_INSET,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
