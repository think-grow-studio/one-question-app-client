import { Pressable, StyleSheet } from 'react-native';
import { XStack, Paragraph, useTheme } from 'tamagui';
import { useTodayQuestionStore } from '../stores/useTodayQuestionStore';

export function QuestionTypeSelector() {
  const theme = useTheme();
  const { questionType, setQuestionType } = useTodayQuestionStore();

  return (
    <XStack gap="$3" ai="center" jc="center">
      <Pressable
        onPress={() => setQuestionType('random')}
        style={[
          styles.chip,
          {
            backgroundColor: questionType === 'random' ? theme.primary?.val : theme.surface?.val,
            borderColor: questionType === 'random' ? theme.primary?.val : theme.borderColor?.val,
          },
        ]}
      >
        <Paragraph
          fontSize={15}
          fontWeight="600"
          color={questionType === 'random' ? '#FFFFFF' : '$colorMuted'}
          letterSpacing={-0.2}
        >
          랜덤 질문
        </Paragraph>
      </Pressable>

      <Pressable
        onPress={() => setQuestionType('yearAgo')}
        style={[
          styles.chip,
          {
            backgroundColor: questionType === 'yearAgo' ? theme.primary?.val : theme.surface?.val,
            borderColor: questionType === 'yearAgo' ? theme.primary?.val : theme.borderColor?.val,
          },
        ]}
      >
        <Paragraph
          fontSize={15}
          fontWeight="600"
          color={questionType === 'yearAgo' ? '#FFFFFF' : '$colorMuted'}
          letterSpacing={-0.2}
        >
          1년 전 오늘
        </Paragraph>
      </Pressable>
    </XStack>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
});
