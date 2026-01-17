import { Screen } from '@/shared/layout/Screen';
import { QuestionHistoryView } from '@/features/question/components/QuestionHistoryView';
import { useAccentColors } from '@/shared/theme';

export default function HomeScreen() {
  const accent = useAccentColors();

  return (
    <Screen edges={['top']} bgColor={accent.background}>
      <QuestionHistoryView />
    </Screen>
  );
}
