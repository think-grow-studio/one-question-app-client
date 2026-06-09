import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack, useTheme } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';
import { BackIcon } from '@/shared/icons/BackIcon';
import { useScreenBackground } from '@/shared/theme';
import { sp } from '@/shared/utils/responsive';
import { AnswerSelectRow } from '@/features/analysis/components/AnswerSelectRow';
import {
  useAnswerSelection,
  type SelectableAnswer,
} from '@/features/analysis/hooks/useAnswerSelection';
import { useCreateAnalysis } from '@/features/analysis/hooks/mutations/useAnalysisMutations';
import type { AnalysisType } from '@/features/analysis/types/api';

function Separator() {
  return <View style={styles.separator} />;
}

export default function AnalysisSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const screenBg = useScreenBackground();
  const { t } = useTranslation('analysis');
  const { type } = useLocalSearchParams<{ type: AnalysisType }>();

  const { items, selectedIds, count, toggle, capHint, isCountValid, min, max } = useAnswerSelection();
  const { mutate: createAnalysis, isPending } = useCreateAnalysis();

  const canSubmit = isCountValid && !isPending && type != null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createAnalysis(
      { type, dailyAnswerIds: [...selectedIds] },
      { onSuccess: () => router.replace('/(tabs)/analysis') },
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: SelectableAnswer }) => (
      <AnswerSelectRow
        date={item.date}
        question={item.question}
        answer={item.answer}
        selected={selectedIds.has(item.dailyAnswerId)}
        onToggle={() => toggle(item.dailyAnswerId)}
      />
    ),
    [selectedIds, toggle],
  );

  return (
    <Screen edges={['top']} bgColor={screenBg}>
      {/* 헤더 */}
      <XStack ai="center" gap="$2" px="$4" pt="$2" pb="$3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <BackIcon size={24} color={theme.color?.val} />
        </Pressable>
        <Text variant="subheading">{t('select.title')}</Text>
      </XStack>

      <View style={styles.listWrap}>
        <FlashList<SelectableAnswer>
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={
            <Text variant="bodySmall" muted style={styles.guide}>
              {t('select.guide')}
            </Text>
          }
          ListEmptyComponent={
            <Text variant="bodySmall" muted style={styles.guide}>
              {t('select.empty')}
            </Text>
          }
        />
      </View>

      {/* 하단 고정 바 */}
      <YStack
        style={[
          styles.footer,
          {
            backgroundColor: theme.surface?.val,
            borderTopColor: theme.borderColor?.val,
            paddingBottom: insets.bottom + sp(12),
          },
        ]}
        gap="$2"
      >
        <XStack jc="space-between" ai="center">
          <Text variant="label">{t('select.counter', { count })}</Text>
          <Text variant="caption">
            {capHint
              ? t('select.tooMany', { max })
              : t('select.range', { min, max })}
          </Text>
        </XStack>
        <Button label={t('select.submit')} enabled={canSubmit} onPress={handleSubmit} />
      </YStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
  },
  list: {
    paddingHorizontal: sp(20),
    paddingBottom: sp(20),
  },
  separator: {
    height: sp(10),
  },
  guide: {
    marginBottom: sp(8),
  },
  footer: {
    paddingHorizontal: sp(20),
    paddingTop: sp(14),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
