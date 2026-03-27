import { Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { XStack, useTheme } from 'tamagui';
import { Screen } from '@/shared/layout/Screen';
import { FeedDetailView } from '@/features/feed/components/FeedDetailView';
import { BackIcon } from '@/shared/icons/BackIcon';
import { useAccentColors } from '@/shared/theme';

export default function FeedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();
  const feedId = Number(id);

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
      <FeedDetailView feedId={feedId} />
    </Screen>
  );
}
