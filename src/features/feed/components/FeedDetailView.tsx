import { ScrollView, Pressable, View, ActivityIndicator } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { getFontStyle } from '@/shared/theme/typography';
import { useAccentColors } from '@/shared/theme';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { fs, sp, radius, cs, deviceValue, SCREEN } from '@/shared/utils/responsive';
import { useToggleLike } from '../hooks/mutations/useFeedMutations';
import { formatFeedDate } from '../utils/feedUtils';
import type { FeedItemDomain } from '../types/api';

interface FeedDetailViewProps {
  item: FeedItemDomain;
}

export function FeedDetailView({ item }: FeedDetailViewProps) {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const toggleLikeMutation = useToggleLike();

  // Optimistic like state (API 응답에 likeCount 없음)
  const [liked, setLiked] = useState(item.liked);
  const [likeCount, setLikeCount] = useState(item.likeCount);

  const styles = useFeedDetailStyles();

  const handleToggleLike = () => {
    const prevLiked = liked;
    const prevCount = likeCount;

    // Optimistic update
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));

    toggleLikeMutation.mutate(item.answerPostId, {
      onError: () => {
        // Rollback on error
        setLiked(prevLiked);
        setLikeCount(prevCount);
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Card - fixed height */}
      <View style={styles.card}>
        {/* Question Section */}
        <View style={styles.questionSection}>
          <XStack alignItems="center" justifyContent="space-between" mb="$3">
            <Text style={styles.labelText}>
              {t('detail.questionLabel')}
            </Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {item.anonymousNickname} · {formatFeedDate(item.postedAt)}
            </Text>
          </XStack>

          <Text style={styles.questionText} numberOfLines={2} adjustsFontSizeToFit>
            {item.questionContent}
          </Text>
          {item.questionDescription && (
            <Text style={styles.descriptionText} numberOfLines={1} adjustsFontSizeToFit>
              {item.questionDescription}
            </Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Answer Section - flex: 1, internal scroll */}
        <View style={styles.answerSection}>
          <Text style={styles.labelText}>
            {t('detail.answerLabel')}
          </Text>

          <ScrollView
            style={styles.answerScroll}
            contentContainerStyle={styles.answerScrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <Text style={styles.answerText}>
              {item.answerContent}
            </Text>
          </ScrollView>
        </View>
      </View>

      {/* Like Button - outside card, fixed below */}
      <View style={styles.likeContainer}>
        <Pressable
          onPress={handleToggleLike}
          style={({ pressed }) => [
            styles.likeButton,
            {
              backgroundColor: liked
                ? `${accent.like}1A`
                : (isDark ? theme.background?.val : theme.backgroundSoft?.val) ?? '#f5f5f5',
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <XStack alignItems="center" gap={sp(8)}>
            <HeartIcon
              size={cs(20)}
              color={liked ? accent.like : (theme.colorMuted?.val ?? '#999')}
              filled={liked}
            />
            <Text
              style={[
                styles.likeText,
                { color: liked ? accent.like : theme.colorMuted?.val },
              ]}
            >
              {liked ? t('detail.likedButton') : t('detail.likeButton')}
            </Text>
            <Text
              style={[
                styles.likeCount,
                { color: liked ? accent.like : theme.colorMuted?.val },
              ]}
            >
              {likeCount}
            </Text>
          </XStack>
        </Pressable>
      </View>
    </View>
  );
}

function useFeedDetailStyles() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  return useMemo(
    () => {
      const cardHeightRatio = deviceValue(0.75, Math.min(0.7, 650 / SCREEN.height));

      return {
        container: {
          flex: 1,
          paddingHorizontal: sp(24),
          paddingTop: sp(12),
        },

        // Card - fixed height, matches QuestionCard style
        card: {
          height: SCREEN.height * cardHeightRatio,
          backgroundColor: theme.surface?.val,
          borderRadius: radius(32),
          borderWidth: 1,
          borderColor: theme.borderColor?.val,
          paddingHorizontal: sp(32),
          paddingTop: sp(24),
          paddingBottom: sp(28),
          flexDirection: 'column' as const,
        },

        // Question section
        questionSection: {
          marginBottom: sp(4),
        },
        labelText: {
          fontSize: fs(13),
          ...getFontStyle('700'),
          color: accent.primary,
          letterSpacing: -0.2,
        },
        metaText: {
          fontSize: fs(11),
          ...getFontStyle('500'),
          color: theme.colorSubtle?.val ?? theme.colorMuted?.val,
          letterSpacing: -0.1,
        },
        questionText: {
          fontSize: fs(20),
          ...getFontStyle('700'),
          lineHeight: fs(30),
          color: theme.color?.val,
          letterSpacing: -0.4,
          minHeight: fs(24),
        },
        descriptionText: {
          fontSize: fs(14),
          lineHeight: fs(20),
          color: theme.colorMuted?.val,
          marginTop: sp(8),
        },

        // Divider
        divider: {
          height: 1,
          backgroundColor: theme.borderColor?.val,
          marginTop: sp(4),
          marginBottom: sp(16),
        },

        // Answer section - takes remaining space
        answerSection: {
          flex: 1,
          gap: sp(12),
        },
        answerScroll: {
          flex: 1,
        },
        answerScrollContent: {
          flexGrow: 1,
          paddingBottom: sp(16),
        },
        answerText: {
          fontSize: fs(16),
          lineHeight: fs(26),
          color: theme.color?.val,
          letterSpacing: -0.3,
        },

        // Like button
        likeContainer: {
          alignItems: 'center' as const,
          marginTop: sp(20),
        },
        likeButton: {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          paddingVertical: sp(12),
          paddingHorizontal: sp(24),
          borderRadius: radius(24),
        },
        likeText: {
          fontSize: fs(15),
          ...getFontStyle('600'),
          letterSpacing: -0.2,
        },
        likeCount: {
          fontSize: fs(14),
          ...getFontStyle('500'),
        },
      };
    },
    [theme, accent, isDark]
  );
}
