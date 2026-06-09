import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { BackIcon } from '@/shared/icons/BackIcon';
import { useScreenBackground, useAccentColors } from '@/shared/theme';
import { sp } from '@/shared/utils/responsive';
import { ResultContent } from '@/features/analysis/components/ResultContent';
import { useAnalysisDetail } from '@/features/analysis/hooks/queries/useAnalysisQueries';

export default function AnalysisResultScreen() {
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();
  const screenBg = useScreenBackground();
  const { t } = useTranslation('analysis');
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = id ? Number(id) : null;

  const { data: detail, isLoading } = useAnalysisDetail(numericId);

  return (
    <Screen edges={['top']} bgColor={screenBg}>
      <XStack ai="center" gap="$2" px="$4" pt="$2" pb="$2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <BackIcon size={24} color={theme.color?.val} />
        </Pressable>
      </XStack>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading || !detail ? (
          <YStack ai="center" jc="center" py="$10" gap="$3">
            <ActivityIndicator color={accent.primary} />
          </YStack>
        ) : detail.status === 'READY' && detail.result ? (
          <ResultContent detail={detail} />
        ) : detail.status === 'FAILED' ? (
          <YStack ai="center" jc="center" py="$10" gap="$2">
            <Text style={styles.emoji}>😶‍🌫️</Text>
            <Text variant="subheading">{t('status.failed.title')}</Text>
            <Text variant="bodySmall" muted center>
              {t('status.failed.message')}
            </Text>
          </YStack>
        ) : (
          <YStack ai="center" jc="center" py="$10" gap="$3">
            <ActivityIndicator color={accent.primary} />
            <Text variant="subheading">{t('result.processingTitle')}</Text>
            <Text variant="bodySmall" muted center>
              {t('result.processingMessage')}
            </Text>
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
  emoji: {
    fontSize: 40,
  },
});
