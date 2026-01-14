import { useState, useEffect } from 'react';
import { Alert, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { ScrollView, XStack, YStack, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { Text } from '@/shared/ui/Text';

const RANDOM_QUESTIONS = [
  '당신이 가장 행복했던 순간은 언제였나요?',
  '오늘 하루 중 가장 감사했던 일은 무엇인가요?',
  '최근에 새롭게 배운 것이 있나요?',
  '당신의 삶에서 가장 중요한 가치는 무엇인가요?',
  '지금 가장 하고 싶은 일은 무엇인가요?',
  '최근에 누군가에게 받은 친절은 무엇인가요?',
  '오늘 자신에게 해주고 싶은 말이 있나요?',
];

function getRandomQuestion() {
  return RANDOM_QUESTIONS[Math.floor(Math.random() * RANDOM_QUESTIONS.length)];
}

export function DailyQuestionAnswer() {
  const router = useRouter();
  const theme = useTheme();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    setQuestion(getRandomQuestion());
  }, []);

  const isSubmitEnabled = answer.trim().length > 0;

  const handleReloadPress = () => {
    Alert.alert(
      '질문 다시 받기',
      '어떤 질문을 받으시겠어요?',
      [
        {
          text: '랜덤 질문',
          onPress: () => setQuestion(getRandomQuestion()),
        },
        {
          text: '과거 질문',
          onPress: () => {
            Alert.alert('준비 중', '과거 질문은 아직 준비 중이에요');
          },
          style: 'default',
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSubmit = () => {
    if (!isSubmitEnabled) return;

    Alert.alert('작성 완료', '답변이 저장되었어요', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} bg="$background">
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Section */}
          <YStack px="$5" pt="$4" gap="$6">
            {/* Question with Reload Button */}
            <YStack gap="$4">
              <XStack ai="flex-start" jc="space-between" gap="$3">
                <Text
                  flex={1}
                  fontSize={24}
                  fontWeight="700"
                  lineHeight={34}
                  letterSpacing={-0.5}
                >
                  {question}
                </Text>
                <Pressable
                  onPress={handleReloadPress}
                  hitSlop={12}
                  style={[
                    styles.reloadButton,
                    { backgroundColor: theme.backgroundSoft?.val },
                  ]}
                >
                  <Text fontSize={20}>↻</Text>
                </Pressable>
              </XStack>
            </YStack>

            {/* Answer Input */}
            <YStack gap="$2">
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.color?.val,
                    backgroundColor: theme.backgroundSoft?.val,
                  },
                ]}
                multiline
                value={answer}
                onChangeText={setAnswer}
                placeholder="여기에 답변을 작성해주세요"
                placeholderTextColor={theme.colorMuted?.val}
                textAlignVertical="top"
              />
              <XStack jc="flex-end">
                <Text fontSize={13} color="$colorMuted">
                  {answer.length}자
                </Text>
              </XStack>
            </YStack>
          </YStack>
        </ScrollView>

        {/* Bottom Button */}
        <YStack px="$5" pb="$4" pt="$3">
          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: isSubmitEnabled
                  ? theme.color?.val
                  : theme.backgroundSoft?.val,
              },
            ]}
            onPress={handleSubmit}
            disabled={!isSubmitEnabled}
          >
            <Text
              fontSize={16}
              fontWeight="600"
              color={isSubmitEnabled ? '$background' : '$colorMuted'}
            >
              작성 완료
            </Text>
          </Pressable>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  reloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderRadius: 16,
    padding: 16,
    minHeight: 200,
    fontSize: 16,
    lineHeight: 24,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
