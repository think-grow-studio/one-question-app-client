import { StatusBar } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TodayQuestionCard } from '@/features/question/components/TodayQuestionCard';
import { useThemeStore } from '@/stores/useThemeStore';

export default function TodayQuestionScreen() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.cardBlue?.val }} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <YStack flex={1} bg="$cardBlue">
        <TodayQuestionCard />
      </YStack>
    </SafeAreaView>
  );
}
