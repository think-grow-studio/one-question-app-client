import { StatusBar, View, StyleSheet } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyQuestionAnswer } from '@/features/answer/components/DailyQuestionAnswer';
import { useThemeStore } from '@/stores/useThemeStore';

export default function AnswerScreen() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background?.val }]}
      edges={['bottom']}
    >
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Modal Handle */}
      <YStack ai="center" pt="$3" pb="$2">
        <View
          style={[
            styles.handle,
            { backgroundColor: theme.borderColor?.val },
          ]}
        />
      </YStack>

      <DailyQuestionAnswer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
