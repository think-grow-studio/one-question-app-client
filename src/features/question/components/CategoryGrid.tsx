import { Paragraph, Spinner, XStack, YStack } from 'tamagui';
import { Chip } from '@/shared/ui/Chip';
import { useQuestionCategories } from '@/features/question/hooks/queries/useQuestionCategories';
import { useCategoryStore } from '../stores/useCategoryStore';

const GAP = '$4';

export function CategoryGrid() {
  const { data: categories = [], isPending } = useQuestionCategories();
  const { selectedCategories, toggleCategory } = useCategoryStore();

  if (isPending) {
    return (
      <YStack ai="center" py="$4">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (!categories.length) {
    return (
      <Paragraph color="$gray10">
        표시할 카테고리가 없습니다. 잠시 후 다시 시도해 주세요.
      </Paragraph>
    );
  }

  return (
    <XStack flexWrap="wrap" rowGap={GAP} justifyContent="space-between">
      {categories.map((category) => (
        <YStack key={category} width="30%">
          <Chip
            label={category}
            selected={selectedCategories.has(category)}
            onPress={() => toggleCategory(category)}
          />
        </YStack>
      ))}
    </XStack>
  );
}
