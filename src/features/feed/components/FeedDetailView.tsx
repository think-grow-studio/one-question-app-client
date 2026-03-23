import { ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { getFontStyle } from '@/shared/theme/typography';
import { useAccentColors } from '@/shared/theme';
import { useFeedDetail } from '../hooks/queries/useFeedQueries';
import { useToggleLike } from '../hooks/mutations/useFeedMutations';

interface FeedDetailViewProps {
  feedId: number;
}

function formatDetailDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
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
        {formatDetailDate(data.answeredAt)}
      </Text>

      {/* Question */}
      <Text variant="subheading" style={styles.question}>
        {data.questionContent}
      </Text>

      {/* Description */}
      {data.questionDescription && (
        <Text variant="bodySmall" muted style={styles.description}>
          {data.questionDescription}
        </Text>
      )}

      {/* Divider */}
      <YStack
        height={1}
        bg="$borderColor"
        my="$4"
      />

      {/* Answer */}
      <Text variant="body" style={styles.answer}>
        {data.answerContent}
      </Text>

      {/* Author + Like */}
      <YStack
        mt="$6"
        pt="$4"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        gap="$3"
      >
        {/* Author */}
        <XStack alignItems="center" gap="$2">
          <YStack
            width={32}
            height={32}
            borderRadius={16}
            bg="$backgroundSoft"
            justifyContent="center"
            alignItems="center"
          >
            <Text variant="caption" {...getFontStyle('600')}>
              {data.authorNickname.charAt(0)}
            </Text>
          </YStack>
          <Text variant="bodySmall" muted>
            {data.authorNickname}
          </Text>
        </XStack>

        {/* Like button */}
        <Pressable
          onPress={handleToggleLike}
          style={({ pressed }) => [
            styles.likeButton,
            {
              backgroundColor: data.isLiked
                ? 'rgba(255, 107, 107, 0.1)'
                : (theme.backgroundSoft?.val ?? '#f5f5f5'),
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <XStack alignItems="center" gap="$2">
            <HeartIcon
              size={18}
              color={data.isLiked ? '#FF6B6B' : (theme.colorMuted?.val ?? '#999')}
              filled={data.isLiked}
            />
            <Text
              variant="bodySmall"
              color={data.isLiked ? '#FF6B6B' : '$colorMuted'}
              {...getFontStyle('600')}
            >
              {data.isLiked ? t('detail.likedButton') : t('detail.likeButton')}
            </Text>
            <Text
              variant="bodySmall"
              color={data.isLiked ? '#FF6B6B' : '$colorMuted'}
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  date: {
    fontSize: 12,
    marginBottom: 12,
  },
  question: {
    lineHeight: 30,
    marginBottom: 8,
  },
  description: {
    lineHeight: 20,
  },
  answer: {
    lineHeight: 26,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
});
