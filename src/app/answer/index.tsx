import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/shared/layout/Screen';
import { DailyQuestionAnswer } from '@/features/answer/components/DailyQuestionAnswer';
import { useAccentColors } from '@/shared/theme';

export default function AnswerScreen() {
  const accent = useAccentColors();
  const params = useLocalSearchParams<{
    mode?: 'edit';
    date?: string;
    question?: string;
    description?: string;
    existingAnswer?: string;
  }>();

  const isEditMode = params.mode === 'edit';
  const editData = isEditMode
    ? {
        date: params.date!,
        question: params.question!,
        description: params.description,
        existingAnswer: params.existingAnswer!,
      }
    : undefined;

  return (
    <Screen variant="modal" edges={['bottom']} bgColor={accent.background}>
      <DailyQuestionAnswer mode={isEditMode ? 'edit' : 'create'} editData={editData} />
    </Screen>
  );
}
