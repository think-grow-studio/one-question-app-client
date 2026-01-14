import { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Paragraph, YStack } from 'tamagui';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/ui/Button';
import { useQuestionPickerStore } from '../stores/useQuestionPickerStore';

const MOCK_QUESTION = '당신이 가장 행복했던 순간은 언제였나요?';

export function QuestionPickerCard() {
  const router = useRouter();
  const { setSelectedQuestion, setIsOpened } = useQuestionPickerStore();

  const [showQuestion, setShowQuestion] = useState(false);

  const handleLetterPress = () => {
    setShowQuestion(true);
    setSelectedQuestion(MOCK_QUESTION);
    setIsOpened(true);
  };

  const handleGoToAnswer = () => {
    router.push('/answer');
  };

  return (
    <YStack flex={1} ai="center" jc="center" gap="$4">
      {/* Letter Icon or Question */}
      {!showQuestion ? (
        <>
          <Pressable
            onPress={handleLetterPress}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Paragraph fontSize={100} lineHeight={110} style={styles.letter}>
              📬
            </Paragraph>
          </Pressable>
          <Paragraph color="$colorMuted" ta="center" fontSize="$4">
            편지를 클릭해보세요 ✨
          </Paragraph>
        </>
      ) : (
        <>
          {/* Question Card */}
          <YStack
            gap="$3"
            p="$5"
            borderRadius="$4"
            bg="$surface"
            borderWidth={1}
            borderColor="$borderColor"
            mx="$4"
            style={styles.questionCard}
          >
            <Paragraph fontSize="$1" color="$colorMuted" fontWeight="500">
              오늘의 질문
            </Paragraph>
            <Paragraph fontSize="$5" fontWeight="500" lineHeight={24} color="$color">
              {MOCK_QUESTION}
            </Paragraph>
          </YStack>

          {/* Answer Button */}
          <YStack px="$4" width="100%">
            <Pressable onPress={handleGoToAnswer}>
              <Button
                label="답변하러 가기"
                onPress={handleGoToAnswer}
                accessibilityLabel="답변 작성 화면으로 이동"
              />
            </Pressable>
          </YStack>
        </>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  letter: {
    textAlign: 'center',
    textAlignVertical: 'center',
    marginVertical: 0,
    paddingVertical: 0,
  },
  questionCard: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
});
