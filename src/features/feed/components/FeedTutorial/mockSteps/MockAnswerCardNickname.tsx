import { useEffect } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { XStack, YStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { cs, fs, radius, sp } from '@/shared/utils/responsive';
import { pickNicknameCharacter } from '@/features/feed/utils/nicknameCharacter';

const MOCK_NICKNAME = '용감한 토끼';
const MOCK_DATE = '방금';
const MOCK_ANSWER =
  '아침에 알람 없이 자연스럽게 눈 떴을 때가 가장 행복해요. 그리고 창밖이 흐릴 때 더 좋아요.';

export function MockAnswerCardNickname() {
  const theme = useTheme();
  const accent = useAccentColors();

  const pulse = useSharedValue(0.4);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.background?.val ?? '#ffffff',
          ...Platform.select({
            ios: {
              shadowColor: theme.color?.val ?? '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 1,
            },
          }),
        },
      ]}
    >
      <YStack gap={sp(8)}>
        {/* Top: nickname (highlighted) · date */}
        <View>
          <XStack alignItems="center" gap={sp(6)} alignSelf="flex-start">
            <View style={styles.nicknameWrap}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.highlightRing,
                  { borderColor: accent.primary },
                  ringStyle,
                ]}
              />
              <Text style={styles.nickname} {...getFontStyle('600')} numberOfLines={1}>
                {MOCK_NICKNAME}
              </Text>
            </View>
            <Image
              source={pickNicknameCharacter(MOCK_NICKNAME)}
              style={styles.avatar}
              resizeMode="contain"
            />
            <Text muted style={styles.metaDot}>
              ·
            </Text>
            <Text style={[styles.meta, { color: accent.primary }]}>{MOCK_DATE}</Text>
          </XStack>
        </View>

        <Text style={styles.answerText} numberOfLines={3} ellipsizeMode="tail">
          {MOCK_ANSWER}
        </Text>

        <XStack justifyContent="flex-end" alignItems="center">
          <View style={styles.likeButton}>
            <HeartIcon size={cs(14)} color={theme.colorMuted?.val ?? '#999'} filled={false} />
            <Text color="$colorMuted" style={styles.likeCount} {...getFontStyle('600')}>
              3
            </Text>
          </View>
        </XStack>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: sp(12),
    paddingHorizontal: sp(18),
    borderRadius: radius(16),
  },
  nicknameWrap: {
    paddingHorizontal: sp(6),
    paddingVertical: sp(2),
  },
  highlightRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderRadius: radius(8),
  },
  // 공유 Text 의 body variant lineHeight:24 상속 끊기 위해 fs 보다 살짝 큰 명시값.
  nickname: {
    fontSize: fs(13),
    lineHeight: fs(18),
    letterSpacing: -0.2,
  },
  avatar: {
    width: cs(22),
    height: cs(22),
  },
  metaDot: {
    fontSize: fs(11),
    lineHeight: fs(15),
  },
  meta: {
    fontSize: fs(11),
    lineHeight: fs(15),
  },
  answerText: {
    fontSize: fs(15),
    lineHeight: fs(23),
    letterSpacing: -0.2,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    paddingVertical: sp(6),
    paddingHorizontal: sp(10),
    borderRadius: radius(14),
  },
  likeCount: {
    fontSize: fs(12),
    lineHeight: fs(16),
  },
});
