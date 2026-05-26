import { useEffect } from 'react';
import { useTheme } from 'tamagui';
import { Screen } from '@/shared/layout/Screen';
import { QuestionHistoryView } from '@/features/question/components/QuestionHistoryView';
import { logScreenView } from '@/services/firebase';

export default function HomeScreen() {
  const theme = useTheme();

  // Analytics: 화면 조회
  useEffect(() => {
    logScreenView('Today');
  }, []);

  return (
    <Screen edges={['top']} bgColor={theme.backgroundSoft?.val}>
      <QuestionHistoryView />
    </Screen>
  );
}
