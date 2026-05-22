import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { fs, sp, radius, cs } from '@/shared/utils/responsive';
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
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.background?.val ?? '#ffffff',
          ...Platform.select({
            ios: {
              shadowColor: accent.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
          transform: [{ scale: pressed && onPress ? 0.99 : 1 }],
        },
      ]}
    >
      {/* Left accent stripe */}
      <View style={[styles.stripe, { backgroundColor: accent.primary }]} />

      <YStack flex={1} gap={sp(8)} pl={sp(14)} pr={sp(14)} py={sp(12)}>
        <XStack ai="center" jc="space-between">
          <Text
            style={[styles.badge, { color: accent.primary }]}
            {...getFontStyle('700')}
          >
            {t('myAnswerBadge')}
          </Text>

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

        <Text style={styles.answerText} numberOfLines={2}>
          {item.answerContent}
        </Text>
      </YStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginHorizontal: sp(20),
    marginTop: sp(4),
    marginBottom: sp(10),
    borderRadius: radius(14),
    overflow: 'hidden',
  },
  stripe: {
    width: 4,
  },
  badge: {
    fontSize: fs(10),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
