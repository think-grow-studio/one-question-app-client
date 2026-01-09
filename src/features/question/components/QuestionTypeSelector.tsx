import { Pressable, StyleSheet } from 'react-native';
import { XStack, Paragraph } from 'tamagui';
import { colors } from '@/constants/colors';
import { useTodayQuestionStore } from '../stores/useTodayQuestionStore';

export function QuestionTypeSelector() {
  const { questionType, setQuestionType } = useTodayQuestionStore();

  return (
    <XStack gap="$3" ai="center" jc="center">
      <Pressable
        onPress={() => setQuestionType('random')}
        style={[
          styles.chip,
          questionType === 'random' && styles.chipActive,
        ]}
      >
        <Paragraph
          fontSize={15}
          fontWeight="600"
          color={questionType === 'random' ? colors.white : colors.textSecondary}
          letterSpacing={-0.2}
        >
          랜덤 질문
        </Paragraph>
      </Pressable>

      <Pressable
        onPress={() => setQuestionType('yearAgo')}
        style={[
          styles.chip,
          questionType === 'yearAgo' && styles.chipActive,
        ]}
      >
        <Paragraph
          fontSize={15}
          fontWeight="600"
          color={questionType === 'yearAgo' ? colors.white : colors.textSecondary}
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
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.systemGray5,
  },
  chipActive: {
    backgroundColor: colors.systemBlue,
    borderColor: colors.systemBlue,
  },
});
