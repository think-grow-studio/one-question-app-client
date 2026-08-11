import { StyleSheet } from 'react-native';
import { Button, XStack, YStack, styled } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useAccentColors } from '@/shared/theme';
import { radius, sp } from '@/shared/utils/responsive';

interface ReportCreateCardProps {
  enabled: boolean;
  statusMessage?: string;
  onPress: () => void;
}

export function ReportCreateCard({ enabled, statusMessage, onPress }: ReportCreateCardProps) {
  const accent = useAccentColors();
  const { t } = useTranslation('analysis');

  return (
    <CreateCardButton
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
    >
      <XStack flex={1} ai="stretch">
        <YStack style={styles.marker} backgroundColor={accent.primary} />
        <YStack gap="$1" flex={1}>
          <Text variant="subheading">{t('landing.createTitle')}</Text>
          <Text variant="bodySmall" muted>
            {t('landing.createDescription')}
          </Text>
          {statusMessage && (
            <Text variant="caption" style={styles.status} color={accent.primary}>
              {statusMessage}
            </Text>
          )}
        </YStack>
      </XStack>
    </CreateCardButton>
  );
}

const CreateCardButton = styled(Button, {
  name: 'ReportCreateCard',
  unstyled: true,
  width: '100%',
  alignItems: 'stretch',
  overflow: 'hidden',
  backgroundColor: '$surface',
  borderColor: '$borderColor',
  borderWidth: StyleSheet.hairlineWidth,
  borderRadius: radius(20),
  paddingVertical: sp(18),
  paddingRight: sp(18),
  pressStyle: {
    opacity: 0.72,
  },
  disabledStyle: {
    opacity: 0.5,
  },
});

const styles = StyleSheet.create({
  marker: {
    width: sp(4),
    borderRadius: radius(2),
    marginRight: sp(14),
  },
  status: {
    marginTop: sp(4),
  },
});
