import { Image, Pressable, StyleSheet, View } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { sp, radius, fs } from '@/shared/utils/responsive';
import { getCardPalette, type AnalysisTypeMeta } from '../constants/analysisTypes';

interface AnalysisBigCardProps {
  meta: AnalysisTypeMeta;
  onPress: () => void;
  disabled?: boolean;
}

export function AnalysisBigCard({ meta, onPress, disabled = false }: AnalysisBigCardProps) {
  const theme = useTheme();
  const isDark = useThemeStore((s) => s.mode) === 'dark';
  const { t } = useTranslation('analysis');
  const palette = getCardPalette(meta.type, isDark);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.shadow,
        { opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface?.val, borderColor: theme.borderColor?.val },
        ]}
      >
        <YStack flex={1} jc="space-between">
          {/* 캐릭터 이미지 */}
          <Image source={meta.image} style={styles.character} resizeMode="contain" />

          {/* 이름 + 태그라인 */}
          <YStack gap="$1" mt="$2">
            <Text variant="subheading" style={{ color: theme.color?.val }}>
              {t(`types.${meta.i18nKey}.name`)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colorMuted?.val }} numberOfLines={2}>
              {t(`types.${meta.i18nKey}.tagline`)}
            </Text>
          </YStack>

          {/* 시작 필 (우하단) */}
          <XStack jc="flex-end" mt="$2">
            <View style={[styles.pill, { backgroundColor: palette.pill }]}>
              <Text style={[styles.pillText, { color: palette.pillText }]}>
                {t('types.cardCta')}  →
              </Text>
            </View>
          </XStack>
        </YStack>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius(24),
    // 라이트모드 깊이감 (다크모드는 그라데이션 대비로 분리됨)
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  card: {
    minHeight: 116,
    borderRadius: radius(22),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: sp(14),
    paddingHorizontal: sp(16),
  },
  character: {
    width: 56,
    height: 56,
  },
  pill: {
    paddingHorizontal: sp(16),
    paddingVertical: sp(9),
    borderRadius: radius(20),
  },
  pillText: {
    fontSize: fs(14),
    fontWeight: '700',
  },
});
