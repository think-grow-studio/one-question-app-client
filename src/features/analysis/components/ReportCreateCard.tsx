import { Pressable, StyleSheet, View } from 'react-native';
import { YStack, useTheme } from 'tamagui';
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
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('analysis');

  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [styles.card, { opacity: pressed && enabled ? 0.72 : enabled ? 1 : 0.5 }]}
    >
      <View style={[styles.content, { backgroundColor: theme.surface?.val, borderColor: theme.borderColor?.val }]}>
        <View style={[styles.marker, { backgroundColor: accent.primary }]} />
        <YStack gap="$1" flex={1}>
          <Text variant="subheading">{t('landing.createTitle')}</Text>
          <Text variant="bodySmall" muted>
            {t('landing.createDescription')}
          </Text>
          {statusMessage && (
            <Text variant="caption" style={[styles.status, { color: accent.primary }]}>
              {statusMessage}
            </Text>
          )}
        </YStack>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius(20),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius(20),
    paddingVertical: sp(18),
    paddingRight: sp(18),
  },
  marker: {
    width: sp(4),
    borderRadius: radius(2),
    marginRight: sp(14),
  },
  status: {
    marginTop: sp(4),
  },
});
