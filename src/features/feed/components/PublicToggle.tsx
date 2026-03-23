import { Switch, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { GlobeIcon } from '@/shared/icons/GlobeIcon';
import { useAccentColors } from '@/shared/theme';

interface PublicToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function PublicToggle({ value, onValueChange }: PublicToggleProps) {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();

  return (
    <YStack
      py="$3"
      px="$4"
      bg="$backgroundSoft"
      borderRadius={12}
      gap="$1.5"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <XStack alignItems="center" gap="$2">
          <GlobeIcon
            size={18}
            color={value ? accent.primary : (theme.colorMuted?.val ?? '#999')}
          />
          <Text variant="bodySmall" {...(value ? { color: accent.primary as any } : { muted: true })}>
            {t('publicToggle.label')}
          </Text>
        </XStack>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: theme.borderColor?.val ?? '#ccc',
            true: accent.primary,
          }}
          thumbColor="#ffffff"
        />
      </XStack>
      <Text variant="caption" muted style={styles.helper}>
        {t('publicToggle.helper')}
      </Text>
    </YStack>
  );
}

const styles = StyleSheet.create({
  helper: {
    fontSize: 11,
    lineHeight: 16,
  },
});
