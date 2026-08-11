import { Image, StyleSheet } from 'react-native';
import { Button, XStack, YStack, styled } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { radius, sp } from '@/shared/utils/responsive';
import { getCardPalette, type AnalysisTypeMeta } from '../constants/analysisTypes';

interface AnalysisTypeCardProps {
  meta: AnalysisTypeMeta;
  onPress: () => void;
}

export function AnalysisTypeCard({ meta, onPress }: AnalysisTypeCardProps) {
  const isDark = useThemeStore((state) => state.mode) === 'dark';
  const { t } = useTranslation('analysis');
  const palette = getCardPalette(meta.type, isDark);
  const name = t(`types.${meta.i18nKey}.name`);
  const shortDescription = t(`types.${meta.i18nKey}.shortDescription`);

  return (
    <TypeCardButton
      onPress={onPress}
      backgroundColor={palette.surface}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityHint={shortDescription}
    >
      <XStack ai="center" gap="$4" flex={1}>
        <Image source={meta.image} style={styles.character} resizeMode="contain" />
        <YStack flex={1} gap="$1.5">
          <Text variant="subheading" textBreakStrategy="balanced">
            {name}
          </Text>
          <Text variant="bodySmall" muted textBreakStrategy="balanced">
            {shortDescription}
          </Text>
        </YStack>
      </XStack>
    </TypeCardButton>
  );
}

const TypeCardButton = styled(Button, {
  name: 'AnalysisTypeCard',
  unstyled: true,
  width: '100%',
  minHeight: sp(128),
  alignItems: 'stretch',
  justifyContent: 'center',
  borderColor: '$borderColor',
  borderWidth: StyleSheet.hairlineWidth,
  borderRadius: radius(22),
  paddingHorizontal: sp(18),
  paddingVertical: sp(18),
  pressStyle: {
    opacity: 0.72,
  },
});

const styles = StyleSheet.create({
  character: {
    width: sp(68),
    height: sp(68),
  },
});
