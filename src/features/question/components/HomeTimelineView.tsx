import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useAccentColors } from '@/shared/theme';
import { useThrottledCallback } from '@/shared/hooks/useThrottledCallback';
import { fs, sp } from '@/shared/utils/responsive';
import { useTimeline } from '../hooks/queries/useQuestionQueries';
import type { DailyQuestionDomain } from '../domain/questionDomain';
import { useDatePickerStore } from '../stores/useDatePickerStore';
import { useHomeViewStore } from '../stores/useHomeViewStore';
import { TimelineRow } from './TimelineRow';

/** 홈 타임라인 뷰 — 지난 질문/답변 기록을 최신순 세로 리스트로 표시 */
export function HomeTimelineView() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('question');
  const setCurrentDate = useDatePickerStore((s) => s.setCurrentDate);
  const setView = useHomeViewStore((s) => s.setView);

  // 누적 페이지·커서는 timeline 쿼리 캐시에 보존 — 뷰 토글로 unmount돼도
  // staleTime 내 재진입 시 refetch 없이 즉시 표시 (가공된 배열은 select에서 생성)
  const query = useTimeline();
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, isRefetching } = query;
  const items = data ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    query.resetPagination();
  }, [query]);

  // 카드 탭 → 해당 날짜로 currentDate 설정 후 카드 뷰 전환 (daily 캐시 시딩되어 즉시 표시)
  const handleCardPress = useThrottledCallback((date: string) => {
    setCurrentDate(date);
    setView('card');
  }, 500);

  const renderItem = useCallback(
    ({ item }: { item: DailyQuestionDomain }) => (
      <TimelineRow item={item} onPress={handleCardPress} />
    ),
    [handleCardPress]
  );

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator color={accent.primary} />
      </YStack>
    );
  }

  if (items.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" px={sp(24)}>
        <Text style={[styles.emptyText, { color: theme.colorMuted?.val }]}>
          {t('timeline.empty')}
        </Text>
      </YStack>
    );
  }

  return (
    <View style={styles.listWrap}>
      <FlashList<DailyQuestionDomain>
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.date}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerSpinner}>
              <ActivityIndicator color={accent.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingTop: sp(22),
    // paddingLeft: sp(1), // 날짜 컬럼을 화면 왼쪽으로 당김 (기존 22)
    paddingRight: sp(22),
    paddingBottom: sp(40),
  },
  emptyText: {
    fontSize: fs(16),
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  footerSpinner: {
    paddingVertical: sp(16),
  },
});
