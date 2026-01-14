import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack } from 'tamagui';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <Screen bg="$cardBlue">
      {/* Settings Button */}
      <XStack position="absolute" top="$4" right="$4" zIndex={10}>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={8}
          accessibilityLabel="설정 화면으로 이동"
        >
          <Text fontSize={24}>⚙️</Text>
        </Pressable>
      </XStack>

      <YStack flex={1} px="$6" ai="center" jc="center" gap="$8">
        <YStack gap="$4" ai="center" mb="$2">
          <Text
            variant="heading"
            center
            fontSize={38}
            fontWeight="800"
            letterSpacing={-0.5}
          >
            오늘의 질문
          </Text>
          <Text
            variant="body"
            center
            muted
            fontSize={17}
            lineHeight={26}
            letterSpacing={-0.2}
          >
            하루에 하나씩, 스스로에게 묻고{'\n'}답해보는 시간
          </Text>
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
    </Screen>
  );
}
