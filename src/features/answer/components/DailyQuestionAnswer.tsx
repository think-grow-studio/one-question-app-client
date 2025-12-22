import { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import { Paragraph, ScrollView, XStack, YStack } from 'tamagui';
import { colors } from '@/constants/colors';
import { Button } from '@/shared/ui/Button';
import { AnonymousToggle } from './AnonymousToggle';

const MOCK_QUESTION =
  '당신이 가장 행복했던 순간은 언제였나요? 그 순간을 떠올리면 어떤 감정이 느껴지나요?';

export function DailyQuestionAnswer() {
  const [answer, setAnswer] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const isSubmitEnabled = answer.trim().length > 0;

  const handleSubmit = () => {
    if (!isSubmitEnabled) {
      return;
    }

    Alert.alert('답변 제출 완료', '오늘의 답변이 성공적으로 제출되었습니다.');
    setAnswer('');
  };

  return (
    <YStack
      flex={1}
      pt="$4"
      pb="$5"
      px="$4"
      gap="$4"
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <YStack gap="$4">
          <Paragraph color="$gray10">오늘의 질문</Paragraph>

          <YStack style={styles.questionCard} gap="$3">
            <Paragraph fontSize="$5" lineHeight={24}>
              {MOCK_QUESTION}
            </Paragraph>
          </YStack>

          <YStack gap="$2">
            <TextInput
              style={styles.answerInput}
              multiline
              value={answer}
              onChangeText={setAnswer}
              placeholder="나의 답변을 자유롭게 적어보세요…"
              placeholderTextColor={colors.textTertiary}
              textAlignVertical="top"
            />
          </YStack>

          <XStack ai="center" jc="space-between" gap="$4">
            <Paragraph fontWeight="600" flex={1}>
              내 답변을 익명으로 커뮤니티에 공개할게요
            </Paragraph>
            <AnonymousToggle value={isAnonymous} onToggle={setIsAnonymous} />
          </XStack>
        </YStack>
      </ScrollView>

      <Button
        label="제출하기"
        enabled={isSubmitEnabled}
        onPress={handleSubmit}
        accessibilityLabel="오늘의 질문 답변 제출하기"
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  questionCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.backgroundPrimary,
    borderWidth: 1,
    borderColor: colors.systemGray5,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: colors.systemGray5,
    borderRadius: 20,
    padding: 16,
    minHeight: 160,
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: colors.white,
    color: colors.textPrimary,
  },
});
