import { Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { XStack, useTheme } from 'tamagui';
import { Screen } from '@/shared/layout/Screen';
import { FeedDetailView } from '@/features/feed/components/FeedDetailView';
import { BackIcon } from '@/shared/icons/BackIcon';
import { useAccentColors } from '@/shared/theme';
import type { FeedItemDomain } from '@/features/feed/types/api';

export default function FeedDetailScreen() {
  const { item: itemJson } = useLocalSearchParams<{ id: string; item: string }>();
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();

  const item: FeedItemDomain = JSON.parse(itemJson ?? '{}');

  return (
    <Screen edges={['top']} bgColor={accent.background}>
      {/* Header */}
      <XStack alignItems="center" px="$4" py="$3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <BackIcon size={24} color={theme.color?.val} />
        </Pressable>
      </XStack>

      {/* Content */}
      <FeedDetailView item={item} />
    </Screen>
  );
}
