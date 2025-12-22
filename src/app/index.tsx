import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, H2, Paragraph, YStack } from 'tamagui';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <YStack flex={1} bg="$background" px="$4" ai="center" jc="center" gap="$4">
        <H2 ta="center">오늘의 질문</H2>
        <Paragraph ta="center" color="$gray10">
          하루에 하나씩, 스스로에게 묻고 싶은 질문을 만나보세요.
        </Paragraph>
        <Button size="$5" onPress={() => router.push('/question')}>
          오늘의 질문 시작하기
        </Button>
        <Button
          size="$5"
          variant="outlined"
          onPress={() => router.push('/answer')}
        >
          질문 작성하기
        </Button>
      </YStack>
    </SafeAreaView>
  );
}
