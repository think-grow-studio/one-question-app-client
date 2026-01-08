import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Separator, YStack } from 'tamagui';
import { HomeHeader } from '@/features/question/components/HomeHeader';
import { QuestionPickerCard } from '@/features/question/components/QuestionPickerCard';

export default function QuestionScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <YStack flex={1} bg="$background" pt="$4" px="$4">
        <HomeHeader />
        <Separator borderColor="$borderColor" mb="$4" />
        <YStack flex={1}>
          <QuestionPickerCard />
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
