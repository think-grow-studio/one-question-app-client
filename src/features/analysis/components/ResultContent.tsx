import { Image, Pressable, StyleSheet, View } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useAccentColors } from '@/shared/theme';
import { sp, radius, fs } from '@/shared/utils/responsive';
import { ANALYSIS_TYPE_META } from '../constants/analysisTypes';
import { useSubmitFeedback } from '../hooks/mutations/useAnalysisMutations';
import type { AnalysisDetailDto, AnalysisFeedback } from '../types/api';

const FEEDBACK_OPTIONS: { value: AnalysisFeedback; emoji: string }[] = [
  { value: 'BAD', emoji: '😞' },
  { value: 'OKAY', emoji: '😐' },
  { value: 'GOOD', emoji: '🙂' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function ResultContent({ detail }: { detail: AnalysisDetailDto }) {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('analysis');
  const { mutate: submitFeedback } = useSubmitFeedback(detail.id);
  const meta = ANALYSIS_TYPE_META[detail.type];

  return (
    <YStack gap="$4" pb="$6">
      {/* 헤더 */}
      <YStack gap="$1">
        <XStack ai="center" gap="$2">
          <Image source={meta.image} style={styles.character} resizeMode="contain" />
          <Text variant="heading" flex={1}>{t(`types.${meta.i18nKey}.name`)}</Text>
        </XStack>
        <Text variant="caption">
          {formatDate(detail.createdAt)} · {t('result.answerCount', { count: detail.answerCount })}
        </Text>
      </YStack>

      {/* 본문 */}
      {detail.result?.type === 'THINKING_PATTERN' && (
        <YStack gap="$4">
          <YStack
            gap="$2"
            style={[styles.summaryCard, { backgroundColor: theme.surface?.val, borderColor: theme.borderColor?.val }]}
          >
            <Text variant="label" style={{ color: accent.primary }}>
              {t('result.summaryTitle')}
            </Text>
            <Text variant="body">{detail.result.data.summary}</Text>
          </YStack>

          {detail.result.data.sections.map((section) => (
            <YStack key={section.key} gap="$2">
              <Text variant="subheading">{section.title}</Text>
              {section.items.map((item, i) => (
                <XStack key={i} gap="$2" ai="flex-start">
                  <View style={[styles.bullet, { backgroundColor: accent.primary }]} />
                  <Text variant="body" flex={1}>
                    {item}
                  </Text>
                </XStack>
              ))}
            </YStack>
          ))}
        </YStack>
      )}

      {detail.result?.type === 'WARM_REFLECTION' && (
        <YStack gap="$3">
          <Text variant="subheading">{t('result.comfortHeading')}</Text>
          <Text variant="body" style={styles.letter}>
            {detail.result.data.letter}
          </Text>
        </YStack>
      )}

      {/* 평가 */}
      <View style={[styles.divider, { backgroundColor: theme.borderColor?.val }]} />
      <YStack gap="$3" ai="center">
        {detail.feedback ? (
          <Text variant="bodySmall" muted>
            {t('result.feedbackThanks')}
          </Text>
        ) : (
          <>
            <Text variant="label">{t('result.feedbackTitle')}</Text>
            <XStack gap="$4">
              {FEEDBACK_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => submitFeedback(opt.value)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.feedbackBtn, pressed && { opacity: 0.6 }]}
                >
                  <Text style={styles.feedbackEmoji}>{opt.emoji}</Text>
                  <Text variant="caption">{t(`feedback.${opt.value.toLowerCase()}`)}</Text>
                </Pressable>
              ))}
            </XStack>
          </>
        )}
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  character: {
    width: 40,
    height: 40,
  },
  summaryCard: {
    borderRadius: radius(18),
    borderWidth: StyleSheet.hairlineWidth,
    padding: sp(16),
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: fs(10),
  },
  letter: {
    lineHeight: fs(16) * 1.8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: sp(4),
    opacity: 0.5,
  },
  feedbackBtn: {
    alignItems: 'center',
    gap: 4,
  },
  feedbackEmoji: {
    fontSize: fs(30),
  },
});
