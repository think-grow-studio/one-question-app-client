import { useTheme } from 'tamagui';
import { Screen } from '@/shared/layout/Screen';
import { DailyQuestionAnswer } from '@/features/answer/components/DailyQuestionAnswer';

export default function AnswerScreen() {
  const theme = useTheme();

  return (
    <Screen variant="modal" edges={['bottom']} bgColor={theme.cardBlue?.val}>
      <DailyQuestionAnswer />
    </Screen>
  );
}
