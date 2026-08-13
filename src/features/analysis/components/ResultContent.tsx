import { Image, StyleSheet } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { sp, radius, fs } from '@/shared/utils/responsive';
import { ANALYSIS_TYPE_META } from '../constants/analysisTypes';
import type { AnalysisDetailDto } from '../types/api';

function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

export function ResultContent({ detail }: { detail: AnalysisDetailDto }) {
  const { t, i18n } = useTranslation('analysis');
  const meta = ANALYSIS_TYPE_META[detail.reportType];
  const locale = i18n.resolvedLanguage ?? i18n.language;

  return (
    <YStack gap="$5" pb="$6">
      <YStack gap="$2">
        <XStack ai="center" gap="$3">
          <Image source={meta.image} style={styles.character} resizeMode="contain" />
          <Text variant="heading" flex={1}>
            {t(`types.${meta.i18nKey}.name`)}
          </Text>
        </XStack>
        <Text variant="caption">
          {formatDate(detail.requestedAt, locale)} ·{' '}
          {t('result.answerCount', { count: detail.sources.length })}
        </Text>
      </YStack>

      {detail.reportType === 'THINKING_PATTERN' ? (
        <YStack
          gap="$3"
          backgroundColor="$surface"
          borderColor="$borderColor"
          style={styles.insightCard}
        >
          <Text variant="label">{t('result.thinkingHeading')}</Text>
          <Text variant="body" style={styles.reportBody}>
            {detail.result}
          </Text>
        </YStack>
      ) : (
        <YStack gap="$3">
          <Text variant="subheading">{t('result.comfortHeading')}</Text>
          <Text variant="body" style={styles.letter}>
            {detail.result}
          </Text>
        </YStack>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  character: {
    width: sp(44),
    height: sp(44),
  },
  insightCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius(18),
    padding: sp(18),
  },
  reportBody: {
    lineHeight: fs(16) * 1.75,
  },
  letter: {
    lineHeight: fs(16) * 1.8,
  },
});
