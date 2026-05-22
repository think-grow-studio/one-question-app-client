import { Pressable, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { fs, sp, radius, cs } from '@/shared/utils/responsive';
import { formatFeedDate } from '../utils/feedUtils';
import type { FeedItemDomain } from '../types/api';

interface MyAnswerCardProps {
  item: FeedItemDomain;
  onPress?: () => void;
}

export function MyAnswerCard({ item, onPress }: MyAnswerCardProps) {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('myAnswerBadge')}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.background?.val ?? '#ffffff',
          borderColor: accent.primary,
          transform: [{ scale: pressed && onPress ? 0.99 : 1 }],
        },
      ]}
    >
      <YStack gap={sp(12)}>
        {/* Top: nickname · date + like count */}
        <XStack ai="center" jc="space-between">
          <XStack ai="center" gap={sp(6)} flex={1}>
            <Text style={styles.nickname} {...getFontStyle('600')} numberOfLines={1}>
              {item.anonymousNickname}
            </Text>
            <Text muted style={styles.metaDot}>·</Text>
            <Text muted style={styles.meta}>
              {formatFeedDate(item.postedAt)}
            </Text>
          </XStack>

          <XStack ai="center" gap={sp(4)}>
            <HeartIcon
              size={cs(12)}
              color={item.liked ? accent.like : (theme.colorMuted?.val ?? '#999')}
              filled={item.liked}
            />
            <Text
              color={item.liked ? accent.like : '$colorMuted'}
              style={styles.likeCount}
              {...getFontStyle('600')}
            >
              {item.likeCount}
            </Text>
          </XStack>
        </XStack>

        {/* Answer body — 2 line preview */}
        <Text style={styles.answerText} numberOfLines={4}>
          {item.answerContent}
        </Text>
      </YStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: sp(20),
    marginVertical: sp(14),
    paddingTop: sp(14),
    paddingBottom: sp(40),
    paddingHorizontal: sp(18),
    borderRadius: radius(16),
    borderWidth: 1.25,
  },
  nickname: {
    fontSize: fs(13),
    letterSpacing: -0.2,
  },
  metaDot: {
    fontSize: fs(11),
  },
  meta: {
    fontSize: fs(11),
  },
  answerText: {
    fontSize: fs(14),
    lineHeight: fs(21),
    letterSpacing: -0.2,
  },
  likeCount: {
    fontSize: fs(11),
  },
});
