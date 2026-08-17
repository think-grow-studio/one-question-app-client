import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';
import { BackIcon } from '@/shared/icons/BackIcon';
import { useScreenBackground } from '@/shared/theme';
import { fs, radius, sp } from '@/shared/utils/responsive';
import { sortAnalysisSourcesNewestFirst } from '../domain/analysisSources';
import { useAnalysisDetail } from '../hooks/queries/useAnalysisQueries';
import type { AnalysisReportSourceDto } from '../types/api';

interface ReportSourcesContentProps {
  reportId: number | null;
  onBack: () => void;
}

function formatQuestionDate(dateString: string, locale: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function SourceCard({
  source,
  locale,
}: {
  source: AnalysisReportSourceDto;
  locale: string;
}) {
  const { t } = useTranslation('analysis');

  return (
    <YStack
      gap="$3"
      backgroundColor="$surface"
      borderColor="$borderColor"
      style={styles.card}
    >
      <Text variant="caption">{formatQuestionDate(source.questionDate, locale)}</Text>
      <YStack gap="$1.5">
        <Text variant="label">{t('sources.questionLabel')}</Text>
        <Text variant="body" style={styles.contentText}>
          {source.questionContent}
        </Text>
      </YStack>
      <YStack height={StyleSheet.hairlineWidth} backgroundColor="$borderColor" />
      <YStack gap="$1.5">
        <Text variant="label">{t('sources.answerLabel')}</Text>
        <Text variant="body" style={styles.contentText}>
          {source.answerContent}
        </Text>
      </YStack>
    </YStack>
  );
}

function SourcesSkeleton() {
  return (
    <YStack gap="$3">
      {[0, 1].map((index) => (
        <YStack
          key={index}
          gap="$3"
          backgroundColor="$surface"
          borderColor="$borderColor"
          style={styles.card}
        >
          <YStack backgroundColor="$backgroundSoft" style={styles.skeletonDate} />
          <YStack backgroundColor="$backgroundSoft" style={styles.skeletonQuestion} />
          <YStack height={StyleSheet.hairlineWidth} backgroundColor="$borderColor" />
          <YStack backgroundColor="$backgroundSoft" style={styles.skeletonAnswer} />
        </YStack>
      ))}
    </YStack>
  );
}

export function ReportSourcesContent({
  reportId,
  onBack,
}: ReportSourcesContentProps) {
  const theme = useTheme();
  const screenBg = useScreenBackground();
  const { t, i18n } = useTranslation('analysis');
  const { data: detail, isLoading, isError, refetch } = useAnalysisDetail(reportId);
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const sources = detail ? sortAnalysisSourcesNewestFirst(detail.sources) : [];
  const canShowSources = detail?.status === 'COMPLETED';
  const showError = reportId == null || isError || (!isLoading && !canShowSources);

  return (
    <Screen edges={['top']} bgColor={screenBg}>
      <XStack ai="center" gap="$3" px="$4" pt="$2" pb="$3">
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('create.backA11y')}
        >
          <BackIcon size={24} color={theme.color?.val} />
        </Pressable>
        <Text variant="subheading" flex={1}>
          {t('sources.title')}
        </Text>
      </XStack>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <SourcesSkeleton />
        ) : showError ? (
          <YStack ai="center" jc="center" py="$10" gap="$3">
            <Text variant="subheading" center>
              {t('sources.loadErrorTitle')}
            </Text>
            <Text variant="bodySmall" muted center>
              {t('sources.loadErrorMessage')}
            </Text>
            {reportId != null && (
              <Button
                label={t('landing.retry')}
                variant="outlined"
                size="small"
                fullWidth={false}
                onPress={() => void refetch()}
              />
            )}
          </YStack>
        ) : sources.length === 0 ? (
          <YStack ai="center" jc="center" py="$10" gap="$2">
            <Text variant="subheading" center>
              {t('sources.emptyTitle')}
            </Text>
            <Text variant="bodySmall" muted center>
              {t('sources.emptyMessage')}
            </Text>
          </YStack>
        ) : (
          <YStack gap="$4">
            <Text variant="bodySmall" muted>
              {t('sources.description', { count: sources.length })}
            </Text>
            <YStack gap="$3">
              {sources.map((source) => (
                <SourceCard
                  key={`${source.questionDate}-${source.questionContent}`}
                  source={source}
                  locale={locale}
                />
              ))}
            </YStack>
          </YStack>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: sp(20),
    paddingBottom: sp(40),
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius(18),
    padding: sp(18),
  },
  contentText: {
    lineHeight: fs(16) * 1.65,
  },
  skeletonDate: {
    width: '32%',
    height: sp(12),
    borderRadius: radius(6),
  },
  skeletonQuestion: {
    width: '88%',
    height: sp(44),
    borderRadius: radius(8),
  },
  skeletonAnswer: {
    width: '100%',
    height: sp(76),
    borderRadius: radius(8),
  },
});
