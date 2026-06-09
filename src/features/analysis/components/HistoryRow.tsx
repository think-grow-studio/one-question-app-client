import { Pressable, StyleSheet, View } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { sp, radius, fs } from '@/shared/utils/responsive';
import { ANALYSIS_TYPE_META } from '../constants/analysisTypes';
import type { AnalysisHistoryItemDto } from '../types/api';

interface HistoryRowProps {
  item: AnalysisHistoryItemDto;
  onPress: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function HistoryRow({ item, onPress }: HistoryRowProps) {
  const theme = useTheme();
  const { t } = useTranslation('analysis');
  const meta = ANALYSIS_TYPE_META[item.type];
  const processing = item.status === 'PROCESSING';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.borderColor?.val, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <XStack ai="center" gap="$3" flex={1}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
        <Text variant="bodySmall" style={styles.name}>
          {t(`types.${meta.i18nKey}.name`)}
        </Text>
        {processing && <View style={[styles.dot, { backgroundColor: theme.colorMuted?.val }]} />}
      </XStack>
      <XStack ai="center" gap="$2">
        <Text variant="caption">{formatDate(item.createdAt)}</Text>
        <Text variant="caption">›</Text>
      </XStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sp(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emoji: {
    fontSize: fs(20),
  },
  name: {
    flexShrink: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius(3),
  },
});
