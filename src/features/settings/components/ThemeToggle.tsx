import { Switch, View } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { ThemeModeIcon } from '@/shared/icons/ThemeModeIcon';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { useThemeTransition } from '@/shared/ui/ThemeTransitionProvider';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { mode } = useThemeStore();
  const { toggleThemeWithTransition } = useThemeTransition();
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('settings');
  const isDark = mode === 'dark';

  const handleThemeToggle = (value: boolean) => {
    const newTheme = value ? 'dark' : 'light';
    // Analytics: 테마 변경
    logEvent(AnalyticsEvents.THEME_CHANGE, {
      theme: newTheme,
    });
    toggleThemeWithTransition();
  };

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
        <ThemeModeIcon mode={isDark ? 'dark' : 'light'} size={24} color={theme.color?.val} />
        {showLabel && (
          <View style={{ flex: 1 }}>
            <Text variant="body" {...getFontStyle('600')}>
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
        onValueChange={handleThemeToggle}
        trackColor={{
          false: theme.borderColor?.val,
          true: accent.primary,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.borderColor?.val}
      />
    </XStack>
  );
}
