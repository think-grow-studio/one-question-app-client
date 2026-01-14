import { StatusBar } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuestionHistoryView } from '@/features/question/components/QuestionHistoryView';
import { useThemeStore } from '@/stores/useThemeStore';

export default function HistoryScreen() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.cardBlue?.val }} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <YStack flex={1} bg="$cardBlue">
        <QuestionHistoryView />
      </YStack>
    </SafeAreaView>
  );
}
