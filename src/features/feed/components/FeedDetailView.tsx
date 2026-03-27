import { ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { getFontStyle } from '@/shared/theme/typography';
import { useAccentColors } from '@/shared/theme';
import { useFeedDetail } from '../hooks/queries/useFeedQueries';
import { useToggleLike } from '../hooks/mutations/useFeedMutations';
import { formatFeedDate } from '../utils/feedUtils';

interface FeedDetailViewProps {
  feedId: number;
}

export function FeedDetailView({ feedId }: FeedDetailViewProps) {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();
  const { data, isLoading } = useFeedDetail(feedId);
  const toggleLikeMutation = useToggleLike();

  if (isLoading || !data) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="small" color={accent.primary} />
      </YStack>
    );
  }

  const handleToggleLike = () => {
    toggleLikeMutation.mutate(feedId);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Date */}
      <Text variant="caption" muted style={styles.date}>
        {formatFeedDate(data.answeredAt)}
      </Text>

      {/* Question */}
      <Text variant="subheading" style={styles.question} {...getFontStyle('700')}>
        {data.questionContent}
      </Text>

      {/* Description */}
      {data.questionDescription && (
        <Text variant="bodySmall" muted style={styles.description}>
          {data.questionDescription}
        </Text>
      )}

      {/* Breathing space instead of divider */}
      <YStack height={32} />

      {/* Answer */}
      <Text variant="body" style={styles.answer}>
        {data.answerContent}
      </Text>

      {/* Author + Like */}
      <YStack mt="$8" gap="$4">
        {/* Author */}
        <XStack alignItems="center" gap="$3">
          <YStack
            width={36}
            height={36}
            borderRadius={18}
            bg="$backgroundSoft"
            justifyContent="center"
            alignItems="center"
          >
            <Text variant="caption" {...getFontStyle('700')}>
              {data.authorNickname.charAt(0)}
            </Text>
          </YStack>
          <YStack>
            <Text variant="bodySmall" {...getFontStyle('600')}>
              {data.authorNickname}
            </Text>
            <Text variant="caption" muted style={{ fontSize: 11 }}>
              {formatFeedDate(data.answeredAt)}
            </Text>
          </YStack>
        </XStack>

        {/* Like button */}
        <Pressable
          onPress={handleToggleLike}
          style={({ pressed }) => [
            styles.likeButton,
            {
              backgroundColor: data.isLiked
                ? `${accent.like}1A`
                : (theme.backgroundSoft?.val ?? '#f5f5f5'),
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <XStack alignItems="center" gap="$2">
            <HeartIcon
              size={18}
              color={data.isLiked ? accent.like : (theme.colorMuted?.val ?? '#999')}
              filled={data.isLiked}
            />
            <Text
              variant="bodySmall"
              color={data.isLiked ? accent.like : '$colorMuted'}
              {...getFontStyle('600')}
            >
              {data.isLiked ? t('detail.likedButton') : t('detail.likeButton')}
            </Text>
            <Text
              variant="bodySmall"
              color={data.isLiked ? accent.like : '$colorMuted'}
            >
              {data.likeCount}
            </Text>
          </XStack>
        </Pressable>
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  date: {
    fontSize: 12,
    marginBottom: 16,
  },
  question: {
    lineHeight: 32,
    marginBottom: 8,
  },
  description: {
    lineHeight: 22,
    marginTop: 4,
  },
  answer: {
    lineHeight: 28,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
});
