import { Platform, Pressable, StyleSheet } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { formatFeedDate } from '../utils/feedUtils';
import type { FeedItemDomain } from '../types/api';

interface FeedCardProps {
  item: FeedItemDomain;
  onPress: () => void;
}

export function FeedCard({ item, onPress }: FeedCardProps) {
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
              shadowColor: theme.color?.val ?? '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            },
            android: {
              elevation: 2,
            },
          }),
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <YStack gap="$4">
        {/* Question label */}
        <XStack alignItems="center" gap="$2">
          <Text
            style={[styles.questionLabel, { color: accent.primary }]}
            {...getFontStyle('700')}
            numberOfLines={1}
          >
            Q.
          </Text>
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={{ flex: 1 }}
            {...getFontStyle('600')}
          >
            {item.questionContent}
          </Text>
        </XStack>

        {/* Answer preview */}
        <Text
          variant="body"
          numberOfLines={3}
          style={styles.answerPreview}
        >
          {item.answerContent}
        </Text>

        {/* Bottom: nickname · date | likes */}
        <XStack justifyContent="space-between" alignItems="center" mt="$1">
          <XStack alignItems="center" gap="$2">
            <Text variant="caption" muted style={styles.meta}>
              {item.authorNickname}
            </Text>
            <Text variant="caption" muted style={styles.metaDot}>
              ·
            </Text>
            <Text variant="caption" muted style={styles.meta}>
              {formatFeedDate(item.answeredAt)}
            </Text>
          </XStack>
          <XStack alignItems="center" gap="$1.5">
            <HeartIcon
              size={14}
              color={item.isLiked ? accent.like : (theme.colorMuted?.val ?? '#999')}
              filled={item.isLiked}
            />
            <Text
              variant="caption"
              color={item.isLiked ? accent.like : '$colorMuted'}
              style={styles.meta}
            >
              {item.likeCount}
            </Text>
          </XStack>
        </XStack>
      </YStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 24,
    paddingHorizontal: 22,
    borderRadius: 16,
  },
  questionLabel: {
    fontSize: 15,
    letterSpacing: -0.3,
  },
  answerPreview: {
    lineHeight: 24,
  },
  meta: {
    fontSize: 11,
  },
  metaDot: {
    fontSize: 11,
  },
});
