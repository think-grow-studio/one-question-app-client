import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { colors } from '@/constants/colors';
import { DailyQuestionAnswer } from '@/features/answer/components/DailyQuestionAnswer';

export default function AnswerScreen() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.white }}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle="dark-content" />
      <DailyQuestionAnswer />
    </SafeAreaView>
  );
}
