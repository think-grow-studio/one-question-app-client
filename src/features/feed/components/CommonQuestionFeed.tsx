import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { YStack, XStack, useTheme } from 'tamagui';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { BackIcon } from '@/shared/icons/BackIcon';
import { FloatingActionButton } from '@/shared/ui/FloatingActionButton';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { fs, sp, cs } from '@/shared/utils/responsive';
import { AnswerCard } from './AnswerCard';
import { MyAnswerCard } from './MyAnswerCard';
import { useDailyPublicQuestion, useInfinitePublicAnswers } from '../hooks/queries/usePublicQuestionQueries';
import {
  useDeletePublicAnswer,
  useTogglePublicAnswerLike,
} from '../hooks/mutations/usePublicQuestionMutations';
import {
  toFeedItemDomain,
  type FeedItemDomain,
  type PublicAnswerDomain,
} from '../types/api';
import {
  addDays,
  formatQuestionDate,
  getServiceToday,
  isSameDay,
  MIN_FEED_DATE,
  startOfDay,
  toServiceDateString,
} from '../utils/feedUtils';
import { AnimatedView, useDateSwipePager } from '../hooks/useDateSwipePager';
import { useInterstitialAd } from '@/features/admob/hooks/useInterstitialAd';
import { useIsAdFreeMember } from '@/features/member/hooks/queries/useMemberQueries';

// 무한 스크롤 fetch 가 이 횟수마다 전면 광고 1회.
const SCROLL_AD_INTERVAL = 5;

// 앱 실행 동안 누적되는 스크롤 fetch 카운터.
// 모듈 스코프라 탭 이동/재진입 / 날짜 swipe 후 컴포넌트 remount 에도 유지됨.
// 앱 재시작 시 0 으로 리셋.
let scrollAdCounter = 0;

interface CommonQuestionFeedProps {}

export function CommonQuestionFeed(_props: CommonQuestionFeedProps) {
  const { t, i18n } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();
  const router = useRouter();

  const todayStr = useMemo(() => getServiceToday(), []);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const canGoNext = !isSameDay(selectedDate, today);

  // 선택 날짜 기준 PDQ 조회. `selectedDate` 가 바뀌면 새 query 가 발동 (캐시 미사용 정책).
  // 오늘 날짜는 feed.tsx 와 동일한 KST 기준 문자열 사용 → 쿼리 키 일치 보장.
  const dateStr = isSameDay(selectedDate, today) ? todayStr : toServiceDateString(selectedDate);
  const canGoPrev = dateStr > MIN_FEED_DATE;
  const dailyQuery = useDailyPublicQuestion(dateStr);
  const pdq = dailyQuery.data;
  const pdqId = pdq?.publicDailyQuestionId;

  const answersQuery = useInfinitePublicAnswers(pdqId);
  const toggleLike = useTogglePublicAnswerLike();
  const deleteMutation = useDeletePublicAnswer({
    // PUBLIC-QUESTION-005: 이미 삭제된 답변 → 다이얼로그 없이 조용히 동기화.
    onAnswerGone: ({ syncQueries }) => syncQueries(),
  });

  // 무한 페이지 → flat list. 본인 답변은 서버가 이미 목록에서 제외.
  const items: FeedItemDomain[] = useMemo(() => {
    if (!pdq) return [];
    const pages = answersQuery.data?.pages ?? [];
    const flatAnswers: PublicAnswerDomain[] = pages.flatMap((p) => p.items);
    return flatAnswers.map((dto) =>
      toFeedItemDomain(dto, {
        questionContent: pdq.content,
        questionDescription: pdq.description,
        mine: false,
      }),
    );
  }, [pdq, answersQuery.data]);

  const myAnswerItem: FeedItemDomain | null = useMemo(() => {
    if (!pdq?.myAnswer) return null;
    return toFeedItemDomain(pdq.myAnswer, {
      questionContent: pdq.content,
      questionDescription: pdq.description,
      mine: true,
    });
  }, [pdq]);

  const myAnswerId = pdq?.myAnswer?.publicDailyQuestionAnswerId;

  const handleMyAnswerDelete = () => {
    if (!pdqId || !myAnswerItem) return;
    void deleteMutation.mutate({
      pdqId,
      answerId: myAnswerItem.answerPostId,
      date: dateStr,
    });
  };

  // 현재 선택된 날짜의 PDQ 에 답변 작성. 과거 날짜도 동일하게 동작 (서버가 거부하면 글로벌 에러로 표시).
  const handleWrite = () => {
    if (!pdq) return;
    router.push({
      pathname: '/answer',
      params: {
        source: 'feed',
        pdqId: String(pdq.publicDailyQuestionId),
        date: dateStr,
        question: pdq.content,
        description: pdq.description ?? '',
      },
    });
  };

  const handleMyAnswerEdit = () => {
    if (!pdq?.myAnswer) return;
    router.push({
      pathname: '/answer',
      params: {
        source: 'feed',
        mode: 'edit',
        pdqId: String(pdq.publicDailyQuestionId),
        answerId: String(pdq.myAnswer.publicDailyQuestionAnswerId),
        date: dateStr,
        question: pdq.content,
        description: pdq.description ?? '',
        existingAnswer: pdq.myAnswer.content,
      },
    });
  };

  const handleAnswerToggleLike = useCallback(
    (item: FeedItemDomain) => {
      if (!pdqId) return;
      // fire-and-forget — mutation hook 이 캐시 낙관 업데이트 / 롤백 / 보정 모두 담당.
      toggleLike.mutate({ pdqId, answerId: item.answerPostId });
    },
    [pdqId, toggleLike],
  );

  const isAdFreeMember = useIsAdFreeMember();
  const { showAd: showScrollAd } = useInterstitialAd('interstitialPublicScroll');

  const handleEndReached = () => {
    if (!answersQuery.hasNextPage || answersQuery.isFetchingNextPage) return;
    answersQuery.fetchNextPage();
    if (isAdFreeMember) return;
    scrollAdCounter += 1;
    if (scrollAdCounter % SCROLL_AD_INTERVAL === 0) {
      void showScrollAd();
    }
  };

  const isRefreshing =
    (dailyQuery.isRefetching || answersQuery.isRefetching) && !dailyQuery.isLoading;

  const handleRefresh = () => {
    void dailyQuery.refetch();
    // 무한 페이지 누적 캐시는 비우고 첫 페이지부터 — 표준 피드 UX + refetch 비용 절감.
    answersQuery.resetPagination();
  };

  const weekdays = useMemo(() => {
    const raw = t('weekdays', { returnObjects: true }) as unknown;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const dateLabel = formatQuestionDate(selectedDate, i18n.language ?? 'ko', weekdays);

  const handlePrev = useCallback(() => {
    if (!canGoPrev) return;
    setSelectedDate((d) => addDays(d, -1));
  }, [canGoPrev]);
  const handleNext = useCallback(() => {
    if (!canGoNext) return;
    setSelectedDate((d) => addDays(d, 1));
  }, [canGoNext]);

  const { gesture: swipePan, slideStyle } = useDateSwipePager({
    onNext: handleNext,
    onPrev: handlePrev,
    canGoNext,
    canGoPrev,
  });

  const arrowColor = theme.color?.val ?? '#000';
  const arrowMutedColor = theme.colorMuted?.val ?? '#bbb';

  const questionCard = (
    <View style={styles.questionWrap}>
      {/* Date navigator */}
      <XStack alignItems="center" justifyContent="center" gap={sp(8)} mb={sp(14)}>
        <Pressable
          onPress={handlePrev}
          disabled={!canGoPrev}
          hitSlop={12}
          style={({ pressed }) => [
            styles.arrowBtn,
            { opacity: !canGoPrev ? 0.35 : pressed ? 0.5 : 1 },
          ]}
        >
          <BackIcon size={cs(18)} color={canGoPrev ? arrowColor : arrowMutedColor} />
        </Pressable>

        <Text style={styles.dateText} {...getFontStyle('600')}>
          {dateLabel}
        </Text>

        <Pressable
          onPress={handleNext}
          disabled={!canGoNext}
          hitSlop={12}
          style={({ pressed }) => [
            styles.arrowBtn,
            styles.arrowRight,
            { opacity: !canGoNext ? 0.35 : pressed ? 0.5 : 1 },
          ]}
        >
          <BackIcon size={cs(18)} color={canGoNext ? arrowColor : arrowMutedColor} />
        </Pressable>
      </XStack>

      {pdq ? (
        <>
          <Text style={styles.questionText} {...getFontStyle('600')}>
            <Text style={[styles.qBadge, { color: accent.primary }]} {...getFontStyle('700')}>
              Q.{' '}
            </Text>
            {pdq.content}
          </Text>

          {pdq.description ? (
            <Text muted style={styles.questionDesc}>
              {pdq.description}
            </Text>
          ) : null}
        </>
      ) : null}

      <View
        style={[
          styles.divider,
          { backgroundColor: theme.borderColor?.val ?? '#eee' },
        ]}
      />
    </View>
  );

  const isLoadingInitial = dailyQuery.isLoading;
  // 404 (PUBLIC-QUESTION-003) — PDQ 없는 날. 빈 상태 화면.
  const isPdqMissing = dailyQuery.isError && !dailyQuery.isLoading;
  // PDQ 는 있지만 답변이 하나도 없을 때 — FAB 으로 작성 유도.
  const isAnswersEmpty = !isLoadingInitial && !!pdq && items.length === 0 && !myAnswerItem;
  const isEmpty = !isLoadingInitial && (isPdqMissing || isAnswersEmpty);

  const handleAnswerPress = useCallback(
    (item: FeedItemDomain) => {
      if (!pdqId) return;
      router.push({
        pathname: '/feed/[id]',
        params: {
          id: String(item.answerPostId),
          pdqId: String(pdqId),
          date: dateStr,
        },
      });
    },
    [pdqId, dateStr, router],
  );

  const renderAnswerItem = useCallback(
    ({ item }: { item: FeedItemDomain }) => (
      <AnswerCard
        item={item}
        onPress={() => handleAnswerPress(item)}
        onToggleLike={handleAnswerToggleLike}
        likeDisabled={item.answerPostId === myAnswerId}
      />
    ),
    [handleAnswerPress, handleAnswerToggleLike, myAnswerId],
  );

  return (
    <YStack flex={1}>
      <GestureDetector gesture={swipePan}>
        <AnimatedView style={[styles.swipeContainer, slideStyle]}>
          {/* Fixed question card */}
          {questionCard}

          {isLoadingInitial ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator color={accent.primary} />
        </YStack>
      ) : isEmpty ? (
        <ScrollView
          style={styles.emptyScroll}
          contentContainerStyle={styles.emptyContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={accent.primary}
              colors={[accent.primary]}
            />
          }
        >
          <Text variant="body" muted center>
            {t(isPdqMissing ? 'noPdq' : 'empty')}
          </Text>
          <Text variant="caption" muted center>
            {t(isPdqMissing ? 'noPdqDesc' : 'emptyDesc')}
          </Text>
        </ScrollView>
      ) : (
        <View style={styles.listWrap}>
          <FlashList<FeedItemDomain>
            data={items}
            renderItem={renderAnswerItem}
            keyExtractor={(item) => String(item.answerPostId)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListHeaderComponent={
              myAnswerItem ? (
                <MyAnswerCard
                  item={myAnswerItem}
                  onEdit={handleMyAnswerEdit}
                  onDelete={handleMyAnswerDelete}
                />
              ) : null
            }
            ListFooterComponent={
              answersQuery.isFetchingNextPage ? (
                <View style={styles.footerSpinner}>
                  <ActivityIndicator color={accent.primary} />
                </View>
              ) : null
            }
          />
        </View>
      )}
        </AnimatedView>
      </GestureDetector>

      {/* 선택된 날짜의 PDQ 에 내 답변이 없을 때만 FAB 노출. 과거 날짜도 동일.
          FAB 은 swipe 영역 밖에 두어 슬라이드와 무관하게 고정. */}
      {pdq && !pdq.myAnswer ? (
        <FloatingActionButton
          onPress={handleWrite}
          aboveTabBar
          label={t('writeButton')}
        />
      ) : null}
    </YStack>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    flex: 1,
  },
  questionWrap: {
    paddingHorizontal: sp(24),
    paddingTop: sp(12),
    paddingBottom: sp(4),
    alignItems: 'center',
  },
  qBadge: {
    fontSize: fs(17),
    letterSpacing: -0.3,
  },
  arrowBtn: {
    padding: sp(4),
  },
  arrowRight: {
    transform: [{ scaleX: -1 }],
  },
  dateText: {
    fontSize: fs(13),
    letterSpacing: -0.2,
    minWidth: cs(140),
    textAlign: 'center',
  },
  questionText: {
    fontSize: fs(15),
    lineHeight: fs(22),
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  questionDesc: {
    marginTop: sp(6),
    fontSize: fs(11),
    lineHeight: fs(16),
    textAlign: 'center',
  },
  divider: {
    height: 1,
    alignSelf: 'stretch',
    marginTop: sp(18),
    opacity: 0.6,
  },
  emptyScroll: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: sp(8),
    paddingHorizontal: sp(16),
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingTop: sp(4),
    paddingBottom: sp(32),
  },
  footerSpinner: {
    paddingVertical: sp(16),
  },
});
