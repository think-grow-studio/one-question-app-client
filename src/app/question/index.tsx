import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { ScrollView, Separator, YStack } from 'tamagui';
import { HomeHeader } from '@/features/question/components/HomeHeader';
import { CategoryGrid } from '@/features/question/components/CategoryGrid';
import { useCategoryStore } from '@/features/question/stores/useCategoryStore';

export default function QuestionScreen() {
  const hasSelection = useCategoryStore((state) => state.hasSelection());
  const selectedCategories = useCategoryStore((state) => state.selectedCategories);

  const handleDrawQuestion = () => {
    console.log('Selected categories:', Array.from(selectedCategories));
    // TODO: Navigate to question detail screen
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <YStack flex={1} bg="$background" pt="$4" pb="$5" px="$4" gap="$4">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <YStack gap="$4">
            <HomeHeader />
            <Separator borderColor="$borderColor" />
            <CategoryGrid />
          </YStack>
        </ScrollView>

        <YStack>
          <Button
            label="질문 뽑기"
            enabled={hasSelection}
            onPress={handleDrawQuestion}
          />
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
