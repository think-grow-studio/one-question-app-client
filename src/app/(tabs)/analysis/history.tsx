import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { XStack, YStack, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { BackIcon } from '@/shared/icons/BackIcon';
import { useAccentColors, useScreenBackground } from '@/shared/theme';
import { sp } from '@/shared/utils/responsive';
import { HistoryRow } from '@/features/analysis/components/HistoryRow';
import { useAnalysisHistory } from '@/features/analysis/hooks/queries/useAnalysisQueries';
import type { AnalysisHistoryItemDto } from '@/features/analysis/types/api';

export default function AnalysisHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('analysis');
  const screenBg = useScreenBackground();

  const { data: items = [], isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAnalysisHistory();

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: AnalysisHistoryItemDto }) => (
      <HistoryRow item={item} onPress={() => router.push(`/(tabs)/analysis/${item.id}`)} />
    ),
    [router],
  );

  return (
    <Screen edges={['top']} bgColor={screenBg}>
      {/* 헤더 (뒤로가기) */}
      <XStack ai="center" gap="$2" px="$5" pt="$2" pb="$3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <BackIcon size={24} color={theme.color?.val} />
        </Pressable>
        <Text variant="subheading">{t('landing.historyTitle')}</Text>
      </XStack>

      {isLoading ? (
        <YStack flex={1} ai="center" jc="center">
          <ActivityIndicator color={accent.primary} />
        </YStack>
      ) : items.length === 0 ? (
        <YStack flex={1} ai="center" jc="center" px="$5">
          <Text variant="bodySmall" muted center>
            {t('landing.historyEmpty')}
          </Text>
        </YStack>
      ) : (
        <View style={styles.listWrap}>
          <FlashList<AnalysisHistoryItemDto>
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator style={styles.footerLoader} color={accent.primary} />
              ) : null
            }
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
  },
  list: {
    paddingHorizontal: sp(20),
    paddingBottom: sp(40),
  },
  footerLoader: {
    paddingVertical: sp(16),
  },
});
