import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { H2, Paragraph, YStack } from 'tamagui';
import { Button } from '@/shared/ui/Button';
import { colors } from '@/constants/colors';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0F7FF' }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <YStack flex={1} bg="#F0F7FF" px="$6" ai="center" jc="center" gap="$8">
        <YStack gap="$4" ai="center" mb="$2">
          <H2 ta="center" fontSize={38} fontWeight="800" letterSpacing={-0.5}>
            오늘의 질문
          </H2>
          <Paragraph ta="center" color="$gray11" fontSize={17} lineHeight={26} letterSpacing={-0.2}>
            하루에 하나씩, 스스로에게 묻고{'\n'}답해보는 시간
          </Paragraph>
        </YStack>

        <YStack width="100%" maxWidth={500} gap="$3">
          <Button
            label="오늘의 질문 받기"
            onPress={() => router.push('/today-question')}
            accessibilityLabel="오늘의 질문 받기 화면으로 이동"
          />
          <Button
            label="지난 질문 보기"
            onPress={() => router.push('/history')}
            variant="outlined"
            accessibilityLabel="지난 질문 보기 화면으로 이동"
          />
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
