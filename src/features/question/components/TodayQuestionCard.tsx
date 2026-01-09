import { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Paragraph, YStack, XStack } from 'tamagui';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInUp,
} from 'react-native-reanimated';
import { Button } from '@/shared/ui/Button';
import { MailIcon } from '@/shared/icons/MailIcon';
import { colors } from '@/constants/colors';
import { useTodayQuestionStore } from '../stores/useTodayQuestionStore';
import { QuestionTypeSelector } from './QuestionTypeSelector';

const MOCK_RANDOM_QUESTIONS = [
  '당신이 가장 행복했던 순간은 언제였나요?',
  '오늘 하루 중 가장 감사했던 일은 무엇인가요?',
  '최근에 새롭게 배운 것이 있나요?',
  '당신의 삶에서 가장 중요한 가치는 무엇인가요?',
];

const MOCK_YEAR_AGO_QUESTION = '1년 전 오늘, 당신은 무엇을 했나요?';

export function TodayQuestionCard() {
  const router = useRouter();
  const { questionType, selectedQuestion, setSelectedQuestion, isQuestionVisible, setIsQuestionVisible } =
    useTodayQuestionStore();

  const scale = useSharedValue(1);

  const handleLetterPress = () => {
    const question =
      questionType === 'random'
        ? MOCK_RANDOM_QUESTIONS[Math.floor(Math.random() * MOCK_RANDOM_QUESTIONS.length)]
        : MOCK_YEAR_AGO_QUESTION;

    setSelectedQuestion(question);
    setIsQuestionVisible(true);
  };

  const handleRedraw = () => {
    setIsQuestionVisible(false);
    setTimeout(() => {
      handleLetterPress();
    }, 300);
  };

  const handleGoToAnswer = () => {
    router.push('/answer');
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 10,
      stiffness: 200,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 200,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <YStack flex={1} ai="center" jc="center" gap="$6" px="$5">
      {!isQuestionVisible ? (
        <>
          <Animated.View style={animatedStyle}>
            <Pressable
              onPress={handleLetterPress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={styles.letterContainer}
            >
              <MailIcon size={140} color={colors.systemBlue} />
            </Pressable>
          </Animated.View>

          <YStack gap="$3" ai="center">
            <Paragraph color="$gray12" ta="center" fontSize={22} fontWeight="700" letterSpacing={-0.3}>
              편지를 열어보세요
            </Paragraph>
            <Paragraph color={colors.textSecondary} ta="center" fontSize={16} letterSpacing={-0.2}>
              오늘의 질문이 담겨있어요
            </Paragraph>
          </YStack>

          <QuestionTypeSelector />
        </>
      ) : (
        <Animated.View
          entering={FadeInUp.springify().damping(15).stiffness(100)}
          style={styles.questionContainer}
        >
          <YStack gap="$5" width="100%">
            <YStack
              gap="$4"
              p="$8"
              borderRadius={24}
              bg={colors.cardWhite}
              borderWidth={1}
              borderColor={colors.systemGray5}
              style={styles.questionCard}
            >
              <XStack ai="center" jc="space-between">
                <Paragraph fontSize={13} color={colors.systemBlue} fontWeight="600" letterSpacing={-0.2} style={{ textTransform: 'uppercase' }}>
                  오늘의 질문
                </Paragraph>
                <Pressable onPress={handleRedraw} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Paragraph fontSize={24} color={colors.systemBlue}>
                    ↻
                  </Paragraph>
                </Pressable>
              </XStack>

              <Paragraph fontSize={20} fontWeight="700" lineHeight={30} letterSpacing={-0.3}>
                {selectedQuestion}
              </Paragraph>
            </YStack>

            <YStack width="100%" gap="$3">
              <Button
                label="답변하러 가기"
                onPress={handleGoToAnswer}
                accessibilityLabel="답변 작성 화면으로 이동"
              />
              <Pressable onPress={handleRedraw} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Paragraph ta="center" color={colors.textSecondary} fontSize={15} fontWeight="600" letterSpacing={-0.2}>
                  질문 다시 뽑기
                </Paragraph>
              </Pressable>
            </YStack>
          </YStack>
        </Animated.View>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  letterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionContainer: {
    width: '100%',
    paddingHorizontal: 20,
    maxWidth: 500,
    alignSelf: 'center',
  },
  questionCard: {
    minHeight: 280,
  },
});
