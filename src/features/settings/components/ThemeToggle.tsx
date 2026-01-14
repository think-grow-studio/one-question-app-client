import { Switch, View } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useThemeStore } from '@/stores/useThemeStore';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { mode, toggleMode } = useThemeStore();
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const isDark = mode === 'dark';

  return (
    <XStack
      ai="center"
      jc="space-between"
      py="$3"
      px="$4"
      bg="$backgroundSoft"
      borderRadius={12}
    >
      <XStack ai="center" gap="$3" flex={1}>
        <Text fontSize={20}>{isDark ? '🌙' : '☀️'}</Text>
        {showLabel && (
          <View style={{ flex: 1 }}>
            <Text variant="body" fontWeight="600">
              {isDark ? t('appearance.darkMode') : t('appearance.lightMode')}
            </Text>
            <Text variant="caption" muted>
              {isDark ? t('appearance.darkModeDescription') : t('appearance.lightModeDescription')}
            </Text>
          </View>
        )}
      </XStack>
      <Switch
        value={isDark}
        onValueChange={toggleMode}
        trackColor={{
          false: theme.borderColor?.val,
          true: theme.primary?.val,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.borderColor?.val}
      />
    </XStack>
  );
}
