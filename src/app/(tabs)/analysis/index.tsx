import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { YStack } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { FloatingActionButton } from '@/shared/ui/FloatingActionButton';
import { SparkleIcon } from '@/shared/icons/SparkleIcon';
import { TimelineViewIcon } from '@/shared/icons/TimelineViewIcon';
import { useScreenBackground } from '@/shared/theme';
import { sp } from '@/shared/utils/responsive';
import { logScreenView } from '@/services/firebase';
import { ANALYSIS_TYPES, type AnalysisTypeMeta } from '@/features/analysis/constants/analysisTypes';
import { StatusCard } from '@/features/analysis/components/StatusCard';
import { AnalysisBigCard } from '@/features/analysis/components/AnalysisBigCard';
import { AnalysisTypeSheet } from '@/features/analysis/components/AnalysisTypeSheet';
import { HistoryRow } from '@/features/analysis/components/HistoryRow';
import { useAnalysisAvailability, useAnalysisHistory } from '@/features/analysis/hooks/queries/useAnalysisQueries';

const DAY_MS = 24 * 60 * 60 * 1000;

type LandingView = 'analyze' | 'history';

export default function AnalysisLandingScreen() {
  const router = useRouter();
  const { t } = useTranslation('analysis');
  const screenBg = useScreenBackground();

  const { data: availability } = useAnalysisAvailability();
  const { data: history } = useAnalysisHistory();

  const [view, setView] = useState<LandingView>('analyze');
  const [sheetMeta, setSheetMeta] = useState<AnalysisTypeMeta | null>(null);

  useEffect(() => {
    logScreenView('Analysis');
  }, []);

  const reason = availability?.reason;
  const canRequest = availability?.canRequest ?? false;
  const historyItems = history?.items ?? [];

  const cooldownDays = availability?.nextAvailableAt
    ? Math.max(1, Math.ceil((new Date(availability.nextAvailableAt).getTime() - Date.now()) / DAY_MS))
    : 0;

  const handleStart = (meta: AnalysisTypeMeta) => {
    setSheetMeta(null);
    router.push(`/(tabs)/analysis/select?type=${meta.type}`);
  };

  return (
    <Screen edges={['top']} bgColor={screenBg}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 — 뷰에 따라 부제만 교체 */}
        <YStack gap="$2">
          <Text variant="heading">{t('title')}</Text>
          <Text variant="bodySmall" muted>
            {view === 'analyze' ? t('landing.heroTitle') : t('landing.historyTitle')}
          </Text>
        </YStack>

        {view === 'analyze' ? (
          <>
            {/* 상태 카드 (게이트 우선순위로 택1) */}
            {reason === 'INSUFFICIENT_ANSWERS' && (
              <StatusCard
                variant="locked"
                current={availability?.answerCount ?? 0}
                required={availability?.requiredCount ?? 10}
              />
            )}
            {reason === 'COOLDOWN' && <StatusCard variant="cooldown" days={cooldownDays} />}
            {reason === 'PROCESSING' && (
              <StatusCard
                variant="processing"
                onPress={() =>
                  availability?.processingId != null &&
                  router.push(`/(tabs)/analysis/${availability.processingId}`)
                }
              />
            )}

            {/* 분석 종류 — 몰입형 빅카드 */}
            <YStack gap="$4">
              {ANALYSIS_TYPES.map((meta) => (
                <AnalysisBigCard
                  key={meta.type}
                  meta={meta}
                  disabled={!canRequest}
                  onPress={() => setSheetMeta(meta)}
                />
              ))}
            </YStack>
          </>
        ) : (
          /* 받은 분석 리스트 */
          historyItems.length > 0 ? (
            <YStack>
              {historyItems.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/(tabs)/analysis/${item.id}`)}
                />
              ))}
            </YStack>
          ) : (
            <Text variant="bodySmall" muted style={styles.empty}>
              {t('landing.historyEmpty')}
            </Text>
          )
        )}
      </ScrollView>

      {/* 우하단 토글 FAB — 분석 항목 ↔ 받은 분석 리스트 */}
      <FloatingActionButton
        aboveTabBar
        onPress={() => setView((v) => (v === 'analyze' ? 'history' : 'analyze'))}
        testID="analysis-view-toggle"
      >
        {view === 'analyze' ? (
          <TimelineViewIcon size={24} color="#FFFFFF" />
        ) : (
          <SparkleIcon size={24} color="#FFFFFF" active />
        )}
      </FloatingActionButton>

      <AnalysisTypeSheet meta={sheetMeta} onClose={() => setSheetMeta(null)} onStart={handleStart} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: sp(20),
    paddingTop: sp(12),
    paddingBottom: sp(100),
    gap: sp(24),
  },
  empty: {
    paddingVertical: sp(12),
  },
});
