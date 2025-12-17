import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/ui/Button';
import { HomeHeader } from '@/features/question/components/HomeHeader';
import { CategoryGrid } from '@/features/question/components/CategoryGrid';
import { useCategoryStore } from '@/features/question/stores/useCategoryStore';
import { colors } from '@/constants/colors';

export default function HomeScreen() {
  const hasSelection = useCategoryStore((state) => state.hasSelection());
  const selectedCategories = useCategoryStore((state) => state.selectedCategories);

  const handleDrawQuestion = () => {
    console.log('Selected categories:', Array.from(selectedCategories));
    // TODO: Navigate to question screen
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <HomeHeader />

        {/* Category Grid */}
        <View style={styles.categorySection}>
          <CategoryGrid />
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Action Button */}
        <View style={styles.actionSection}>
          <Button
            label="질문 뽑기"
            enabled={hasSelection}
            onPress={handleDrawQuestion}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  categorySection: {
    paddingBottom: 32,
  },
  spacer: {
    flex: 1,
  },
  actionSection: {
    paddingTop: 16,
  },
});
