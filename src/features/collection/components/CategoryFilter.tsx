import { ScrollView, View, Pressable } from 'react-native';
import { Text } from 'tamagui';

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
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomColor: '#F0F0F0',
        borderBottomWidth: 1,
        backgroundColor: '#FFFFFF',
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
            backgroundColor: selectedCategory === null ? '#007AFF' : '#E5E5EA',
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 70,
          }}
        >
          <Text
            size="$3"
            weight="600"
            color={selectedCategory === null ? '$white' : '$gray10'}
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
                selectedCategory === category ? '#007AFF' : '#E5E5EA',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 70,
            }}
          >
            <Text
              size="$3"
              weight="600"
              color={
                selectedCategory === category ? '$white' : '$gray10'
              }
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
