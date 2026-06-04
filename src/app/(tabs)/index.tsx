import { useEffect } from 'react';
import { Screen } from '@/shared/layout/Screen';
import { QuestionHistoryView } from '@/features/question/components/QuestionHistoryView';
import { useScreenBackground } from '@/shared/theme';
import { logScreenView } from '@/services/firebase';

export default function HomeScreen() {
  const screenBg = useScreenBackground();

  // Analytics: 화면 조회
  useEffect(() => {
    logScreenView('Today');
  }, []);

  return (
    <Screen edges={['top']} bgColor={screenBg}>
      <QuestionHistoryView />
    </Screen>
  );
}
