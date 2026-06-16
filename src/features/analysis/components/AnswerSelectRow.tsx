import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { CheckIcon } from '@/shared/icons/CheckIcon';
import { useAccentColors } from '@/shared/theme';
import { sp, radius } from '@/shared/utils/responsive';

interface AnswerSelectRowProps {
  date: string; // YYYY-MM-DD
  question: string;
  answer: string;
  selected: boolean;
  onToggle: () => void;
}

/**
 * 분석할 답변 선택 카드 — "날짜 헤더 + 우상단 체크 배지" 형태.
 * 타임라인(좌측 날짜레일 + 커넥터선)과 의도적으로 다른 시각 언어를 쓴다.
 */
function AnswerSelectRowBase({ date, question, answer, selected, onToggle }: AnswerSelectRowProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('analysis');

  // 날짜 헤더 — 로케일별 포맷은 i18n 키로 (다른 해면 연도 포함)
  const [year, month, day] = date.split('-').map(Number);
  const dateLabel =
    year !== new Date().getFullYear()
      ? t('select.dateHeaderWithYear', { year, month, day })
      : t('select.dateHeader', { month, day });

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? `${accent.primary}14` : theme.surface?.val,
          borderColor: selected ? accent.primary : theme.borderColor?.val,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <YStack gap="$2">
        {/* 상단: 날짜 헤더 + 체크 배지 */}
        <XStack ai="center" jc="space-between">
          <Text variant="label" style={{ color: selected ? accent.primary : theme.color?.val }}>
            {dateLabel}
          </Text>
          <View
            style={[
              styles.badge,
              selected
                ? { backgroundColor: accent.primary, borderColor: accent.primary }
                : { borderColor: theme.borderColor?.val },
            ]}
          >
            {selected && <CheckIcon size={16} color={accent.textOnPrimary} />}
          </View>
        </XStack>

        {/* 질문 */}
        <XStack gap="$2" ai="flex-start">
          <Text variant="caption" style={{ color: accent.primary }}>
            {t('select.questionLabel')}
          </Text>
          <Text variant="caption" numberOfLines={2} style={styles.question}>
            {question}
          </Text>
        </XStack>

        {/* 답변 */}
        <Text variant="bodySmall" numberOfLines={3} muted={!selected}>
          {answer}
        </Text>
      </YStack>
    </Pressable>
  );
}

export const AnswerSelectRow = memo(AnswerSelectRowBase);

const styles = StyleSheet.create({
  card: {
    padding: sp(16),
    borderRadius: radius(18),
    borderWidth: 1.5,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    flex: 1,
  },
});
