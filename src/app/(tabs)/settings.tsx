import { View } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { ThemeToggle } from '@/features/settings/components/ThemeToggle';
import { AccentColorPicker } from '@/features/settings/components/AccentColorPicker';
import { NotificationSettings } from '@/features/settings/components/NotificationSettings';

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('settings');

  return (
    <Screen>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            alignItems: 'center',
            borderBottomColor: theme.borderColor?.val,
            borderBottomWidth: 1,
          }}
        >
          <Text variant="subheading" fontWeight="600">
            {t('title')}
          </Text>
        </View>

        {/* Content */}
        <YStack flex={1} px="$4" py="$4" gap="$4">
          {/* Appearance Section */}
          <YStack gap="$2">
            <Text variant="caption" muted px="$1">
              {t('appearance.title')}
            </Text>
            <ThemeToggle />
            <AccentColorPicker />
          </YStack>

          {/* Notification Section */}
          <YStack gap="$2" mt="$4">
            <Text variant="caption" muted px="$1">
              {t('notification.sectionTitle')}
            </Text>
            <NotificationSettings />
          </YStack>

          {/* App Info Section */}
          <YStack gap="$2" mt="$4">
            <Text variant="caption" muted px="$1">
              {t('appInfo.title')}
            </Text>
            <YStack
              py="$3"
              px="$4"
              bg="$backgroundSoft"
              borderRadius={12}
              gap="$2"
            >
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text variant="body" muted>
                  {t('appInfo.version')}
                </Text>
                <Text variant="body">1.0.0</Text>
              </View>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </Screen>
  );
}
