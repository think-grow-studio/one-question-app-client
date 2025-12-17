import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

export function HomeHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 질문</Text>
      <Text style={styles.subtitle}>
        관심 카테고리를 선택하고 질문을 뽑아보세요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.textPrimary,
    letterSpacing: 0.37,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
