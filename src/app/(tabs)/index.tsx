import { useEffect } from 'react';
import { Screen } from '@/shared/layout/Screen';
import { QuestionHistoryView } from '@/features/question/components/QuestionHistoryView';
import { useAccentColors } from '@/shared/theme';
import { logScreenView } from '@/services/firebase';

export default function HomeScreen() {
  const accent = useAccentColors();

  // Analytics: 화면 조회
  useEffect(() => {
    logScreenView('Today');
  }, []);
  
  return (
    <Screen edges={['top']} bgColor={accent.background}>
      <QuestionHistoryView />
    </Screen>
  );
}
