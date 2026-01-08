import { H1, Paragraph, YStack } from 'tamagui';

export function HomeHeader() {
  return (
    <YStack gap="$2" pt="$2" pb="$4">
      <H1>오늘의 질문</H1>
      <Paragraph color="$gray10">
        편지를 클릭하면 오늘의 질문이 나타나요.
      </Paragraph>
    </YStack>
  );
}
