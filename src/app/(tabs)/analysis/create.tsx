import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { BackIcon } from '@/shared/icons/BackIcon';
import { Text } from '@/shared/ui/Text';
import { useScreenBackground } from '@/shared/theme';
import { sp } from '@/shared/utils/responsive';
import { AnalysisTypeCard } from '@/features/analysis/components/AnalysisTypeCard';
import { AnalysisTypeSheet } from '@/features/analysis/components/AnalysisTypeSheet';
import {
  ANALYSIS_TYPES,
  type AnalysisTypeMeta,
} from '@/features/analysis/constants/analysisTypes';

export default function AnalysisCreateScreen() {
  const router = useRouter();
  const theme = useTheme();
  const screenBg = useScreenBackground();
  const { t } = useTranslation('analysis');
  const [sheetMeta, setSheetMeta] = useState<AnalysisTypeMeta | null>(null);

  const handleStart = (meta: AnalysisTypeMeta) => {
    setSheetMeta(null);
    router.push({
      pathname: '/(tabs)/analysis/select',
      params: { type: meta.type },
    });
  };

  return (
    <Screen edges={['top']} bgColor={screenBg}>
      <XStack ai="center" gap="$2" px="$4" pt="$2" pb="$3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('create.backA11y')}
        >
          <BackIcon size={24} color={theme.color?.val} />
        </Pressable>
        <Text variant="subheading">{t('create.title')}</Text>
      </XStack>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodySmall" muted style={styles.guide}>
          {t('create.guide')}
        </Text>

        <YStack gap="$3">
          {ANALYSIS_TYPES.map((meta) => (
            <AnalysisTypeCard
              key={meta.type}
              meta={meta}
              onPress={() => setSheetMeta(meta)}
            />
          ))}
        </YStack>
      </ScrollView>

      <AnalysisTypeSheet
        meta={sheetMeta}
        onClose={() => setSheetMeta(null)}
        onStart={handleStart}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: sp(20),
    paddingTop: sp(8),
    paddingBottom: sp(40),
  },
  guide: {
    marginBottom: sp(20),
  },
});
