import { useState } from 'react';
import { Alert, TextInput, StyleSheet } from 'react-native';
import { ScrollView, XStack, YStack, useTheme } from 'tamagui';
import { Button } from '@/shared/ui/Button';
import { Text } from '@/shared/ui/Text';
import { Card } from '@/shared/ui/Card';
import { AnonymousToggle } from './AnonymousToggle';

const MOCK_QUESTION =
  '당신이 가장 행복했던 순간은 언제였나요? 그 순간을 떠올리면 어떤 감정이 느껴지나요?';

export function DailyQuestionAnswer() {
  const [answer, setAnswer] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const theme = useTheme();

  const isSubmitEnabled = answer.trim().length > 0;

  const handleSubmit = () => {
    if (!isSubmitEnabled) {
      return;
    }

    Alert.alert('답변 제출 완료', '오늘의 답변이 성공적으로 제출되었습니다.');
    setAnswer('');
  };

  return (
    <YStack flex={1} pt="$4" pb="$5" px="$4" gap="$4" bg="$background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <YStack gap="$4">
          <Text variant="caption" muted>
            오늘의 질문
          </Text>

          <Card elevated radius="large" padding="large">
            <Text variant="body" fontSize={17} lineHeight={26}>
              {MOCK_QUESTION}
            </Text>
          </Card>

          <YStack gap="$2">
            <TextInput
              style={[
                styles.answerInput,
                {
                  borderColor: theme.borderColor?.val,
                  backgroundColor: theme.background?.val,
                  color: theme.color?.val,
                },
              ]}
              multiline
              value={answer}
              onChangeText={setAnswer}
              placeholder="나의 답변을 자유롭게 적어보세요…"
              placeholderTextColor={theme.placeholderColor?.val}
              textAlignVertical="top"
            />
          </YStack>

          <XStack ai="center" jc="space-between" gap="$4">
            <Text variant="body" fontWeight="600" flex={1}>
              내 답변을 익명으로 커뮤니티에 공개할게요
            </Text>
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
  scrollContent: {
    paddingBottom: 32,
  },
  answerInput: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 160,
    fontSize: 16,
    lineHeight: 24,
  },
});
