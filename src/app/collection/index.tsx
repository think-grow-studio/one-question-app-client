import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, Pressable, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { useCollectionStore } from '@/features/collection/stores/useCollectionStore';
import { FilterFAB } from '@/features/collection/components/FilterFAB';
import { FilterModal } from '@/features/collection/components/FilterModal';
import { LetterArchiveView } from '@/features/collection/components/LetterArchiveView';
import { fetchLetters } from '@/features/collection/api/collectionApi';
import { Letter } from '@/features/collection/types/api';
import { useThemeStore } from '@/stores/useThemeStore';

export default function CollectionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeStore();
  const {
    viewMode,
    expandedLetterId,
    selectedCategory,
    selectedStartDate,
    selectedEndDate,
    setViewMode,
    toggleExpanded,
    setSelectedCategory,
    setSelectedStartDate,
    setSelectedEndDate,
  } = useCollectionStore();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    try {
      setIsLoading(true);
      const response = await fetchLetters();
      setLetters(response.letters);
    } catch (error) {
      console.error('Failed to load letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['top', 'bottom']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={{ flex: 1, backgroundColor: theme.background?.val }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomColor: theme.borderColor?.val,
            borderBottomWidth: 1,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text variant="body" fontSize={18}>←</Text>
          </Pressable>
          <Text variant="subheading" fontWeight="600">
            Letter Archive
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        {isLoading ? (
          <YStack
            flex={1}
            ai="center"
            jc="center"
            gap="$2"
          >
            <Text variant="body" muted>로딩 중...</Text>
          </YStack>
        ) : letters.length === 0 ? (
          <YStack
            flex={1}
            ai="center"
            jc="center"
            gap="$2"
          >
            <Text variant="body" fontWeight="600">
              아직 답변이 없어요
            </Text>
            <Text variant="body" muted>
              질문에 답변하면 여기에 나타납니다
            </Text>
          </YStack>
        ) : (
          <LetterArchiveView
            letters={letters}
            viewMode={viewMode}
            expandedLetterId={expandedLetterId}
            onToggleExpand={toggleExpanded}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            onStartDateChange={setSelectedStartDate}
            onEndDateChange={setSelectedEndDate}
          />
        )}

        {/* Floating Action Button */}
        {!isLoading && letters.length > 0 && (
          <FilterFAB onPress={() => setShowFilter(true)} />
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        selectedMode={viewMode}
        onModeChange={setViewMode}
        onClose={() => setShowFilter(false)}
      />
    </SafeAreaView>
  );
}
