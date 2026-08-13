import { useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { YStack } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';
import { useAccentColors, useScreenBackground } from '@/shared/theme';
import { radius, sp } from '@/shared/utils/responsive';
import { logScreenView } from '@/services/firebase';
import { ReportCreateCard } from '@/features/analysis/components/ReportCreateCard';
import { ReportListRow } from '@/features/analysis/components/ReportListRow';
import { useAnalysisAvailability, useAnalysisHistory } from '@/features/analysis/hooks/queries/useAnalysisQueries';
import type { AnalysisHistoryItemDto } from '@/features/analysis/types/api';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function AnalysisLandingScreen() {
  const router = useRouter();
  const { t } = useTranslation('analysis');
  const accent = useAccentColors();
  const screenBg = useScreenBackground();
  const { data: availability } = useAnalysisAvailability();
  const historyQuery = useAnalysisHistory();
  const {
    data: historyItems = [],
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
    refetch,
  } = historyQuery;

  useEffect(() => {
    logScreenView('Analysis');
  }, []);

  const reason = availability?.reason;
  const canRequest = availability?.canRequest ?? false;
  const cooldownDays = availability?.nextAvailableAt
    ? Math.max(1, Math.ceil((new Date(availability.nextAvailableAt).getTime() - Date.now()) / DAY_MS))
    : 0;
  const statusMessage =
    reason === 'INSUFFICIENT_ANSWERS'
      ? t('status.locked.progress', {
          current: availability?.answerCount ?? 0,
          required: availability?.requiredCount ?? 10,
        })
      : reason === 'COOLDOWN'
        ? t('status.cooldown.message', { days: cooldownDays })
        : reason === 'PROCESSING'
          ? t('list.processingHint')
          : undefined;
  const showLoadError = isError && historyItems.length === 0;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);

  const renderItem = useCallback(
    ({ item }: { item: AnalysisHistoryItemDto }) => (
      <View style={styles.row}>
        <ReportListRow
          item={item}
          onPress={() => router.push(`/(tabs)/analysis/${item.analysisReportId}`)}
        />
      </View>
    ),
    [router],
  );

  const listHeader = (
    <YStack gap="$3" style={styles.header}>
      <YStack gap="$2">
        <Text variant="heading">{t('title')}</Text>
        <Text variant="bodySmall" muted>
          {t('landing.subtitle')}
        </Text>
      </YStack>

      <ReportCreateCard
        enabled={canRequest}
        statusMessage={statusMessage}
        onPress={() => router.push('/(tabs)/analysis/create')}
      />

      <YStack gap="$1" style={styles.sectionHeading}>
        <Text variant="subheading">{t('landing.reportsTitle')}</Text>
        <Text variant="caption" muted>
          {t('landing.sortLabel')}
        </Text>
      </YStack>
    </YStack>
  );

  const listEmpty = isLoading ? (
    <YStack gap="$3" style={styles.skeletonList}>
      <ReportRowSkeleton />
      <ReportRowSkeleton />
      <ReportRowSkeleton />
    </YStack>
  ) : showLoadError ? (
    <YStack gap="$3" ai="center" px="$5" style={styles.emptyState}>
      <Text variant="bodySmall" muted center>
        {t('landing.loadError')}
      </Text>
      <Button label={t('landing.retry')} variant="outlined" size="small" onPress={() => void refetch()} />
    </YStack>
  ) : (
    <YStack gap="$2" ai="center" px="$5" style={styles.emptyState}>
      <Text variant="subheading" center>
        {t('landing.emptyTitle')}
      </Text>
      <Text variant="bodySmall" muted center>
        {t('landing.emptyMessage')}
      </Text>
    </YStack>
  );

  const listFooter = isFetchingNextPage ? (
    <ActivityIndicator style={styles.footerLoader} color={accent.primary} />
  ) : isFetchNextPageError ? (
    <YStack gap="$2" ai="center" style={styles.footerError}>
      <Text variant="caption" muted center>
        {t('landing.loadError')}
      </Text>
      <Button
        label={t('landing.retry')}
        variant="outlined"
        size="small"
        onPress={() => void fetchNextPage()}
      />
    </YStack>
  ) : null;

  return (
    <Screen edges={['top']} bgColor={screenBg}>
      <FlashList<AnalysisHistoryItemDto>
        data={showLoadError || isLoading ? [] : historyItems}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.analysisReportId)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
      />
    </Screen>
  );
}

function ReportRowSkeleton() {
  return (
    <YStack backgroundColor="$surface" borderColor="$borderColor" style={styles.skeletonRow}>
      <YStack backgroundColor="$backgroundSoft" style={styles.skeletonTitle} />
      <YStack backgroundColor="$backgroundSoft" style={styles.skeletonSubtitle} />
    </YStack>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: sp(20),
    paddingTop: sp(8),
    paddingBottom: sp(40),
  },
  header: {
    paddingBottom: sp(24),
  },
  sectionHeading: {
    paddingTop: sp(8),
  },
  row: {
    marginBottom: sp(12),
  },
  skeletonList: {
    paddingBottom: sp(12),
  },
  skeletonRow: {
    minHeight: sp(92),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius(18),
    justifyContent: 'center',
    paddingHorizontal: sp(20),
    gap: sp(10),
  },
  skeletonTitle: {
    width: '48%',
    height: sp(14),
    borderRadius: radius(7),
  },
  skeletonSubtitle: {
    width: '36%',
    height: sp(10),
    borderRadius: radius(5),
  },
  emptyState: {
    paddingVertical: sp(24),
  },
  footerLoader: {
    paddingVertical: sp(16),
  },
  footerError: {
    paddingVertical: sp(16),
  },
});
