import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useFeedList } from '../hooks/queries/useFeedQueries';
import { FeedCard } from './FeedCard';
import { useAccentColors } from '@/shared/theme';
import type { FeedItemDomain } from '../domain/feedDomain';

export function FeedList() {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();
  const router = useRouter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useFeedList();

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  const handlePress = (feedId: number) => {
    router.push({ pathname: '/feed/[id]', params: { id: String(feedId) } });
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="small" color={accent.primary} />
      </YStack>
    );
  }

  if (allItems.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$2" px="$4">
        <Text variant="body" muted center>
          {t('empty')}
        </Text>
        <Text variant="caption" muted center>
          {t('emptyDesc')}
        </Text>
      </YStack>
    );
  }

  return (
    <FlashList<FeedItemDomain>
      data={allItems}
      renderItem={({ item }) => (
        <FeedCard item={item} onPress={() => handlePress(item.feedId)} />
      )}
      keyExtractor={(item) => String(item.feedId)}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={styles.listContent}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={accent.primary} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
