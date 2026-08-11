import { Image, Pressable, StyleSheet, View } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { radius, sp } from '@/shared/utils/responsive';
import { ANALYSIS_TYPE_META, getCardPalette } from '../constants/analysisTypes';
import { isAnalysisInProgress } from '../domain/analysisStatus';
import type { AnalysisHistoryItemDto } from '../types/api';

interface ReportListRowProps {
  item: AnalysisHistoryItemDto;
  onPress: () => void;
}

export function ReportListRow({ item, onPress }: ReportListRowProps) {
  const theme = useTheme();
  const isDark = useThemeStore((state) => state.mode) === 'dark';
  const { t, i18n } = useTranslation('analysis');
  const meta = ANALYSIS_TYPE_META[item.type];
  const palette = getCardPalette(item.type, isDark);
  const processing = isAnalysisInProgress(item.status);
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(item.createdAt));

  const statusLabel = processing
    ? t('list.processing')
    : item.status === 'FAILED'
      ? t('list.failed')
      : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.72 : 1 }]}
    >
      <XStack
        ai="center"
        gap="$3"
        style={[styles.content, { backgroundColor: theme.surface?.val, borderColor: theme.borderColor?.val }]}
      >
        <View style={[styles.marker, { backgroundColor: palette.pill }]} />
        <Image source={meta.image} style={styles.character} resizeMode="contain" />
        <YStack flex={1} gap="$1">
          <Text variant="label" numberOfLines={1}>
            {t(`types.${meta.i18nKey}.name`)}
          </Text>
          <Text variant="caption">
            {dateLabel} · {t('list.answerCount', { count: item.answerCount })}
          </Text>
          {statusLabel && (
            <YStack gap="$0.5">
              <Text variant="caption" style={{ color: theme.color?.val }}>
                {statusLabel}
              </Text>
              {processing && <Text variant="caption">{t('list.processingHint')}</Text>}
            </YStack>
          )}
        </YStack>
      </XStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius(18),
  },
  content: {
    minHeight: sp(92),
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius(18),
    paddingVertical: sp(14),
    paddingRight: sp(16),
  },
  marker: {
    alignSelf: 'stretch',
    width: sp(4),
    borderRadius: radius(2),
  },
  character: {
    width: sp(48),
    height: sp(48),
  },
});
