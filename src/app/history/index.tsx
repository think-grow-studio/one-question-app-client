import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { YStack } from 'tamagui';
import { QuestionHistoryView } from '@/features/question/components/QuestionHistoryView';
import { colors } from '@/constants/colors';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0F7FF' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <YStack flex={1} bg="#F0F7FF">
        <QuestionHistoryView />
      </YStack>
    </SafeAreaView>
  );
}
