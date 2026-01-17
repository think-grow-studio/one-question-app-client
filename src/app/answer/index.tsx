import { Screen } from '@/shared/layout/Screen';
import { DailyQuestionAnswer } from '@/features/answer/components/DailyQuestionAnswer';
import { useAccentColors } from '@/shared/theme';

export default function AnswerScreen() {
  const accent = useAccentColors();

  return (
    <Screen variant="modal" edges={['bottom']} bgColor={accent.background}>
      <DailyQuestionAnswer />
    </Screen>
  );
}
