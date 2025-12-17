import { View, StyleSheet, Dimensions } from 'react-native';
import { Chip } from '@/shared/ui/Chip';
import { CATEGORIES, Category } from '@/constants/categories';
import { useCategoryStore } from '../stores/useCategoryStore';

const HORIZONTAL_PADDING = 24;
const GAP = 16;
const COLUMNS = 3;

export function CategoryGrid() {
  const { selectedCategories, toggleCategory } = useCategoryStore();

  const screenWidth = Dimensions.get('window').width;
  const chipWidth = (screenWidth - HORIZONTAL_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.container}>
      {CATEGORIES.map((category) => (
        <View key={category} style={[styles.chipWrapper, { width: chipWidth }]}>
          <Chip
            label={category}
            selected={selectedCategories.has(category)}
            onPress={() => toggleCategory(category as Category)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  chipWrapper: {
    // Width set dynamically
  },
});
