import { Pressable, StyleSheet } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { getFontStyle } from '@/shared/theme/typography';
import type { FeedItemDomain } from '../domain/feedDomain';

interface FeedCardProps {
  item: FeedItemDomain;
  onPress: () => void;
}

function formatFeedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export function FeedCard({ item, onPress }: FeedCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundSoft?.val,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <YStack gap="$2">
        {/* Question */}
        <Text
          variant="caption"
          numberOfLines={1}
          {...getFontStyle('600')}
        >
          {item.questionContent}
        </Text>

        {/* Date */}
        <Text variant="caption" muted style={styles.date}>
          {formatFeedDate(item.answeredAt)}
        </Text>

        {/* Answer preview */}
        <Text
          variant="body"
          numberOfLines={3}
          style={styles.answerPreview}
        >
          {item.answerContent}
        </Text>

        {/* Bottom: nickname + likes */}
        <XStack justifyContent="space-between" alignItems="center" mt="$1">
          <Text variant="caption" muted>
            {item.authorNickname}
          </Text>
          <XStack alignItems="center" gap="$1.5">
            <HeartIcon
              size={14}
              color={item.isLiked ? '#FF6B6B' : (theme.colorMuted?.val ?? '#999')}
              filled={item.isLiked}
            />
            <Text
              variant="caption"
              color={item.isLiked ? '#FF6B6B' : '$colorMuted'}
              style={{ fontSize: 12 }}
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
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  date: {
    fontSize: 11,
  },
  answerPreview: {
    lineHeight: 22,
  },
});
