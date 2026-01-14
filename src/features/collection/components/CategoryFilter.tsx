import { ScrollView, View, Pressable } from 'react-native';
import { useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomColor: theme.borderColor?.val,
        borderBottomWidth: 1,
        backgroundColor: theme.background?.val,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{
          gap: 8,
          paddingRight: 16,
        }}
      >
        {/* All Categories Button */}
        <Pressable
          onPress={() => onSelectCategory(null)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: selectedCategory === null ? theme.primary?.val : theme.backgroundSoft?.val,
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 70,
          }}
        >
          <Text
            variant="bodySmall"
            fontWeight="600"
            color={selectedCategory === null ? '#FFFFFF' : '$colorMuted'}
          >
            전체
          </Text>
        </Pressable>

        {/* Category Buttons */}
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => onSelectCategory(category)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor:
                selectedCategory === category ? theme.primary?.val : theme.backgroundSoft?.val,
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 70,
            }}
          >
            <Text
              variant="bodySmall"
              fontWeight="600"
              color={selectedCategory === category ? '#FFFFFF' : '$colorMuted'}
              numberOfLines={1}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
