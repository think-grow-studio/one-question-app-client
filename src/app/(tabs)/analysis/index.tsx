import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { useScreenBackground } from '@/shared/theme';
import { sp, radius } from '@/shared/utils/responsive';
import { logScreenView } from '@/services/firebase';
import { ANALYSIS_TYPES, type AnalysisTypeMeta } from '@/features/analysis/constants/analysisTypes';
import { StatusCard } from '@/features/analysis/components/StatusCard';
import { AnalysisBigCard } from '@/features/analysis/components/AnalysisBigCard';
import { AnalysisTypeSheet } from '@/features/analysis/components/AnalysisTypeSheet';
import { useAnalysisAvailability, useAnalysisHistory } from '@/features/analysis/hooks/queries/useAnalysisQueries';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function AnalysisLandingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation('analysis');
  const screenBg = useScreenBackground();

  const { data: availability } = useAnalysisAvailability();
  const { data: historyItems = [] } = useAnalysisHistory();

  const [sheetMeta, setSheetMeta] = useState<AnalysisTypeMeta | null>(null);

  useEffect(() => {
    logScreenView('Analysis');
  }, []);

  const reason = availability?.reason;
  const canRequest = availability?.canRequest ?? false;

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
        {/* 헤더 (탭 루트 — 제목 + 부제) */}
        <YStack gap="$2">
          <Text variant="heading">{t('title')}</Text>
          <Text variant="bodySmall" muted>
            {t('landing.heroTitle')}
          </Text>
        </YStack>

        {/* 리포트 목록 진입 (상단) */}
        <Pressable
          onPress={() => router.push('/(tabs)/analysis/history')}
          style={({ pressed }) => [
            styles.listEntry,
            {
              backgroundColor: theme.surface?.val,
              borderColor: theme.borderColor?.val,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <XStack ai="center" jc="space-between">
            <XStack ai="center" gap="$2">
              <Text variant="label">{t('landing.historyTitle')}</Text>
              {historyItems.length > 0 && (
                <Text variant="caption">{historyItems.length}</Text>
              )}
            </XStack>
            <Text variant="label" style={{ color: theme.colorMuted?.val }}>
              →
            </Text>
          </XStack>
        </Pressable>

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

        {/* 새 분석 — 분석 종류 카드 */}
        {canRequest && (
          <YStack gap="$3">
            <Text variant="label">{t('landing.chooseTitle')}</Text>
            <YStack gap="$4">
              {ANALYSIS_TYPES.map((meta) => (
                <AnalysisBigCard key={meta.type} meta={meta} onPress={() => setSheetMeta(meta)} />
              ))}
            </YStack>
          </YStack>
        )}

      </ScrollView>

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
    paddingTop: sp(8),
    paddingBottom: sp(40),
    gap: sp(24),
  },
  listEntry: {
    paddingHorizontal: sp(16),
    paddingVertical: sp(14),
    borderRadius: radius(14),
    borderWidth: StyleSheet.hairlineWidth,
  },
});
