import { StatusBar } from 'react-native';
import { useTheme } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyQuestionAnswer } from '@/features/answer/components/DailyQuestionAnswer';
import { useThemeStore } from '@/stores/useThemeStore';

export default function AnswerScreen() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.cardBlue?.val }}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <DailyQuestionAnswer />
    </SafeAreaView>
  );
}
