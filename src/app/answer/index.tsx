import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/shared/layout/Screen';
import { DailyQuestionAnswer } from '@/features/answer/components/DailyQuestionAnswer';
import { PublicQuestionAnswer } from '@/features/feed/components/PublicQuestionAnswer';
import { useScreenBackground } from '@/shared/theme';

export default function AnswerScreen() {
  const screenBg = useScreenBackground();
  const params = useLocalSearchParams<{
    source?: string;
    mode?: 'edit';
    date: string;
    question: string;
    description?: string;
    // 일일 질문 전용
    existingAnswer?: string;
    // PDQ 전용
    pdqId?: string;
    answerId?: string;
  }>();

  const isEditMode = params.mode === 'edit';

  if (params.source === 'feed' && params.pdqId) {
    return (
      <Screen variant="modal" edges={['bottom']} bgColor={screenBg}>
        <PublicQuestionAnswer
          mode={isEditMode ? 'edit' : 'create'}
          pdqId={Number(params.pdqId)}
          date={params.date}
          question={params.question}
          description={params.description}
          existingAnswerId={params.answerId ? Number(params.answerId) : undefined}
          existingAnswer={params.existingAnswer}
        />
      </Screen>
    );
  }

  const data = {
    date: params.date,
    question: params.question,
    description: params.description,
    existingAnswer: params.existingAnswer,
  };

  return (
    <Screen variant="modal" edges={['bottom']} bgColor={screenBg}>
      <DailyQuestionAnswer mode={isEditMode ? 'edit' : 'create'} data={data} />
    </Screen>
  );
}
