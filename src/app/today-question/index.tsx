import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { YStack } from 'tamagui';
import { TodayQuestionCard } from '@/features/question/components/TodayQuestionCard';
import { colors } from '@/constants/colors';

export default function TodayQuestionScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0F7FF' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <YStack flex={1} bg="#F0F7FF">
        <TodayQuestionCard />
      </YStack>
    </SafeAreaView>
  );
}
