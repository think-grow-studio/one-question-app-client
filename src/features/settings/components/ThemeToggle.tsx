import { Switch, View } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { useThemeStore, ThemeMode } from '@/stores/useThemeStore';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { mode, toggleMode } = useThemeStore();
  const theme = useTheme();
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
              {isDark ? '다크 모드' : '라이트 모드'}
            </Text>
            <Text variant="caption" muted>
              {isDark ? '어두운 배경으로 눈의 피로를 줄여요' : '밝은 배경으로 가독성을 높여요'}
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
