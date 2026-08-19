import { ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Button, XStack, YStack, styled, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { radius, sp } from '@/shared/utils/responsive';
import { ANALYSIS_TYPE_META, getCardPalette } from '../constants/analysisTypes';
import { getAnalysisStatusColor } from '../constants/analysisStatusColors';
import {
  getAnalysisStatusLabelKey,
  isAnalysisReportOpenable,
} from '../model/analysisPresentation';
import type { AnalysisHistoryItemDto } from '../types/api';

interface ReportListRowProps {
  item: AnalysisHistoryItemDto;
  onPress: () => void;
}

export function ReportListRow({ item, onPress }: ReportListRowProps) {
  const theme = useTheme();
  const isDark = useThemeStore((state) => state.mode) === 'dark';
  const { t, i18n } = useTranslation('analysis');
  const meta = ANALYSIS_TYPE_META[item.reportType];
  const palette = getCardPalette(item.reportType, isDark);
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(item.requestedAt));
  const statusLabel = t(getAnalysisStatusLabelKey(item.status));
  const statusColor = getAnalysisStatusColor(item.status, {
    pending: theme.statusPending.val,
    completed: theme.statusCompleted.val,
    failed: theme.statusFailed.val,
  });
  const openable = isAnalysisReportOpenable(item.status);
  const pending = item.status === 'PENDING';

  return (
    <ReportRowButton
      disabled={!openable}
      onPress={openable ? onPress : undefined}
      accessibilityRole={openable ? 'button' : undefined}
      accessibilityState={{ disabled: !openable }}
    >
      <XStack ai="center" gap="$3" flex={1}>
        <YStack style={styles.marker} backgroundColor={palette.pill} />
        <Image source={meta.image} style={styles.character} resizeMode="contain" />
        <YStack flex={1} gap="$1">
          <Text variant="label" numberOfLines={1}>
            {t(`types.${meta.i18nKey}.name`)}
          </Text>
          <XStack ai="center" gap="$1.5">
            <Text variant="caption">{dateLabel} ·</Text>
            <Text variant="caption" color={statusColor}>
              {statusLabel}
            </Text>
            {pending && <ActivityIndicator size="small" color={statusColor} />}
          </XStack>
        </YStack>
      </XStack>
    </ReportRowButton>
  );
}

const ReportRowButton = styled(Button, {
  name: 'ReportListRow',
  unstyled: true,
  width: '100%',
  alignItems: 'stretch',
  overflow: 'hidden',
  backgroundColor: '$surface',
  borderColor: '$borderColor',
  borderWidth: StyleSheet.hairlineWidth,
  borderRadius: radius(18),
  minHeight: sp(92),
  paddingVertical: sp(14),
  paddingRight: sp(16),
  pressStyle: {
    opacity: 0.72,
  },
});

const styles = StyleSheet.create({
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
