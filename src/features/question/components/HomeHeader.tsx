import { H1, Paragraph, YStack } from 'tamagui';

export function HomeHeader() {
  return (
    <YStack gap="$2" pt="$2" pb="$4">
      <H1>오늘의 질문</H1>
      <Paragraph color="$gray10">
        관심 있는 주제를 선택하고 오늘의 질문을 뽑아보세요.
      </Paragraph>
    </YStack>
  );
}
