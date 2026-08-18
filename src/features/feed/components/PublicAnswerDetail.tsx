import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { XStack, YStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { BackIcon } from '@/shared/icons/BackIcon';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { useQuestionCardStyles } from '@/shared/ui/QuestionCard';
import { useAccentColors, useScreenBackground } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { cs, fs, radius, sp } from '@/shared/utils/responsive';
import { pickNicknameCharacter } from '@/features/feed/utils/nicknameCharacter';
import {
  useDailyPublicQuestion,
  useInfinitePublicAnswers,
} from '../hooks/queries/usePublicQuestionQueries';
import { useTogglePublicAnswerLike } from '../hooks/mutations/usePublicQuestionMutations';
import { formatFeedDate } from '../utils/feedUtils';

interface PublicAnswerDetailProps {
  answerPostId: number;
  pdqId: number;
  date: string;
}

export function PublicAnswerDetail({ answerPostId, pdqId, date }: PublicAnswerDetailProps) {
  const router = useRouter();
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();
  const screenBg = useScreenBackground();
  const cardStyles = useQuestionCardStyles();

  const dailyQuery = useDailyPublicQuestion(date);
  const answersQuery = useInfinitePublicAnswers(pdqId);
  const toggleLike = useTogglePublicAnswerLike();

  // 캐시(피드 화면이 mount 중이므로 query subscriber 가 유지됨) 에서 id 매칭.
  // refetchOnMount: 'always' 정책이라 백그라운드 refetch 가 돌지만, 기존 데이터는 그대로 보임.
  const answer = useMemo(() => {
    const pages = answersQuery.data?.pages ?? [];
    for (const page of pages) {
      const match = page.items.find((it) => it.publicDailyQuestionAnswerId === answerPostId);
      if (match) return match;
    }
    return undefined;
  }, [answersQuery.data, answerPostId]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleToggleLike = useCallback(() => {
    if (!answer) return;
    toggleLike.mutate({ pdqId, answerId: answer.publicDailyQuestionAnswerId });
  }, [answer, pdqId, toggleLike]);

  const isLoading =
    (dailyQuery.isLoading || answersQuery.isLoading) && !answer && !dailyQuery.data;

  const isNotFound = !isLoading && (!dailyQuery.data || !answer);

  return (
    <YStack flex={1} style={{ backgroundColor: screenBg }}>
      {/* Header — back button only. ScreenHeader 가 title+right 구조라 detail 용 inline 사용. */}
      <XStack style={styles.header} ai="center">
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={t('detail.backA11y')}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <BackIcon size={cs(22)} color={theme.color?.val ?? '#000'} />
        </Pressable>
      </XStack>

      {isLoading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={accent.primary} />
        </View>
      ) : isNotFound ? (
        <View style={styles.centerFill}>
          <Text variant="body" muted center style={styles.notFoundTitle}>
            {t('detail.notFound')}
          </Text>
          <Text variant="caption" muted center>
            {t('detail.notFoundDesc')}
          </Text>
        </View>
      ) : (
        <View style={styles.cardContainer}>
          {/* cardFull → SCREEN.height * 0.75 고정 높이. 카드는 길이 일정하고, 내부 답변
              본문만 ScrollView 로 감싸 길어지면 그 영역 안에서만 스크롤. */}
          <View style={[cardStyles.card, cardStyles.cardFull]}>
            {/* 질문 영역 (고정) */}
            <View>
              <Text style={cardStyles.questionText}>
                <Text
                  style={[cardStyles.questionText, { color: accent.primary }]}
                  {...getFontStyle('700')}
                >
                  Q.{' '}
                </Text>
                {dailyQuery.data?.content ?? ''}
              </Text>
              {dailyQuery.data?.description ? (
                <Text style={cardStyles.questionDescription}>
                  {dailyQuery.data.description}
                </Text>
              ) : null}
            </View>

            <View style={cardStyles.divider} />

            {/* 답변 작성자 정보 (고정) */}
            {answer ? (
              <XStack ai="center" gap={sp(6)} mb={sp(12)}>
                <Text style={styles.nickname} {...getFontStyle('600')} numberOfLines={1}>
                  {answer.anonymousNickname}
                </Text>
                <Image
                  source={pickNicknameCharacter(answer.anonymousNickname)}
                  style={styles.avatar}
                  resizeMode="contain"
                />
                <Text muted style={styles.metaDot}>
                  ·
                </Text>
                <Text style={[styles.meta, { color: accent.primary }]}>
                  {formatFeedDate(answer.answeredAt)}
                </Text>
              </XStack>
            ) : null}

            {/* 답변 본문 (가변, 내부 스크롤). 답변이 짧으면 짧은대로, 길면 이 영역 안에서 스크롤. */}
            {answer ? (
              <ScrollView
                style={styles.answerScroll}
                contentContainerStyle={styles.answerContent}
                showsVerticalScrollIndicator
                nestedScrollEnabled
              >
                <Text style={cardStyles.answerText}>{answer.content}</Text>
              </ScrollView>
            ) : null}

            {/* 좋아요 버튼 (카드 하단 고정) */}
            {answer ? (
              <XStack jc="flex-end" ai="center" pt={sp(12)}>
                <Pressable
                  onPress={handleToggleLike}
                  accessibilityRole="button"
                  accessibilityLabel={
                    answer.liked ? t('detail.likedButton') : t('detail.likeButton')
                  }
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.likeButton,
                    {
                      backgroundColor: answer.liked ? `${accent.like}14` : 'transparent',
                      borderColor: answer.liked
                        ? accent.like
                        : theme.borderColor?.val ?? '#e5e7eb',
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    },
                  ]}
                >
                  <HeartIcon
                    size={cs(16)}
                    color={answer.liked ? accent.like : theme.colorMuted?.val ?? '#999'}
                    filled={answer.liked}
                  />
                  <Text
                    style={[
                      styles.likeCount,
                      {
                        color: answer.liked ? accent.like : theme.colorMuted?.val ?? '#999',
                      },
                    ]}
                    {...getFontStyle('600')}
                  >
                    {t('detail.likeCount', { count: answer.likeCount })}
                  </Text>
                </Pressable>
              </XStack>
            ) : null}
          </View>
        </View>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: sp(8),
    paddingVertical: sp(8),
  },
  backBtn: {
    padding: sp(8),
  },
  cardContainer: {
    paddingHorizontal: sp(20),
    paddingTop: sp(4),
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(24),
    gap: sp(8),
  },
  notFoundTitle: {
    fontSize: fs(16),
    letterSpacing: -0.3,
  },
  nickname: {
    fontSize: fs(14),
    lineHeight: fs(19),
    letterSpacing: -0.2,
  },
  avatar: {
    width: cs(24),
    height: cs(24),
  },
  metaDot: {
    fontSize: fs(12),
    lineHeight: fs(16),
  },
  meta: {
    fontSize: fs(12),
    lineHeight: fs(16),
  },
  // flex:1 로 카드 안 남는 vertical 공간을 모두 차지. 짧은 답변은 위에 정렬되고,
  // 긴 답변은 이 영역 안에서만 스크롤.
  answerScroll: {
    flex: 1,
  },
  answerContent: {
    flexGrow: 1,
    paddingBottom: sp(4),
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    paddingVertical: sp(8),
    paddingHorizontal: sp(14),
    borderRadius: radius(20),
    borderWidth: 1,
  },
  likeCount: {
    fontSize: fs(13),
    lineHeight: fs(17),
  },
});
