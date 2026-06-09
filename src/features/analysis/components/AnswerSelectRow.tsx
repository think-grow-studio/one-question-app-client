import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { useAccentColors } from '@/shared/theme';
import { sp, radius } from '@/shared/utils/responsive';

interface AnswerSelectRowProps {
  date: string; // YYYY-MM-DD
  question: string;
  answer: string;
  selected: boolean;
  onToggle: () => void;
}

function formatShort(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function AnswerSelectRowBase({ date, question, answer, selected, onToggle }: AnswerSelectRowProps) {
  const theme = useTheme();
  const accent = useAccentColors();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? `${accent.primary}14` : theme.surface?.val,
          borderColor: selected ? accent.primary : theme.borderColor?.val,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.check,
          selected
            ? { backgroundColor: accent.primary, borderColor: accent.primary }
            : { borderColor: theme.borderColor?.val },
        ]}
      >
        {selected && <Text style={[styles.checkMark, { color: accent.textOnPrimary }]}>✓</Text>}
      </View>

      <YStack flex={1} gap="$1">
        <XStack ai="center" gap="$2">
          <Text variant="caption" style={{ color: accent.primary }}>
            {formatShort(date)}
          </Text>
          <Text variant="caption" numberOfLines={1} style={styles.question}>
            {question}
          </Text>
        </XStack>
        <Text variant="bodySmall" numberOfLines={2} muted={!selected}>
          {answer}
        </Text>
      </YStack>
    </Pressable>
  );
}

export const AnswerSelectRow = memo(AnswerSelectRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp(12),
    padding: sp(14),
    borderRadius: radius(16),
    borderWidth: 1,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkMark: {
    fontSize: 13,
    fontWeight: '700',
  },
  question: {
    flexShrink: 1,
  },
});
