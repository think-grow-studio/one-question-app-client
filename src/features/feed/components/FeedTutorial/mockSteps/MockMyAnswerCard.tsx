import { Image, Pressable, StyleSheet, View } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { EditIcon } from '@/shared/icons/EditIcon';
import { TrashIcon } from '@/shared/icons/TrashIcon';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { cs, fs, radius, sp } from '@/shared/utils/responsive';
import { pickNicknameCharacter } from '@/features/feed/utils/nicknameCharacter';

const MOCK_NICKNAME = '따뜻한 거북이';
const MOCK_DATE = '오늘';
const MOCK_ANSWER =
  '오늘은 비가 와서 좋아요. 빗소리 들으면서 따뜻한 차 한 잔 마시는 시간이 가장 평화롭더라구요.';

export function MockMyAnswerCard() {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.background?.val ?? '#ffffff',
          borderColor: accent.primary,
        },
      ]}
    >
      <YStack gap={sp(12)}>
        <XStack ai="center" jc="space-between">
          <XStack ai="center" gap={sp(6)} flex={1}>
            <Text style={styles.nickname} {...getFontStyle('600')} numberOfLines={1}>
              {MOCK_NICKNAME}
            </Text>
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

          <XStack ai="center" gap={sp(4)}>
            <HeartIcon
              size={cs(12)}
              color={theme.colorMuted?.val ?? '#999'}
              filled={false}
            />
            <Text color="$colorMuted" style={styles.likeCount} {...getFontStyle('600')}>
              0
            </Text>
          </XStack>
        </XStack>

        <Text style={styles.answerText} numberOfLines={3} ellipsizeMode="tail">
          {MOCK_ANSWER}
        </Text>

        <XStack jc="flex-end" gap={sp(8)}>
          <Pressable disabled style={styles.actionBtn} accessibilityLabel={t('editAnswer.button')}>
            <EditIcon size={cs(18)} color={accent.primary} />
          </Pressable>
          <Pressable disabled style={styles.actionBtn} accessibilityLabel={t('deleteAnswer.button')}>
            <TrashIcon size={cs(18)} color="#EF4444" />
          </Pressable>
        </XStack>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: sp(14),
    paddingHorizontal: sp(18),
    borderRadius: radius(16),
    borderWidth: 1.25,
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
    fontSize: fs(14),
    lineHeight: fs(21),
    letterSpacing: -0.2,
  },
  likeCount: {
    fontSize: fs(11),
    lineHeight: fs(15),
  },
  actionBtn: {
    padding: sp(4),
  },
});
