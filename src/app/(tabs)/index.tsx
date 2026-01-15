import { useTheme } from 'tamagui';
import { Screen } from '@/shared/layout/Screen';
import { QuestionHistoryView } from '@/features/question/components/QuestionHistoryView';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <Screen edges={['top']} bgColor={theme.cardBlue?.val}>
      <QuestionHistoryView />
    </Screen>
  );
}
