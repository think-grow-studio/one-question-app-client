import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { HomeIcon } from '@/shared/icons/HomeIcon';
import { SettingsIcon } from '@/shared/icons/SettingsIcon';
import { useAccentColors } from '@/shared/theme';

export default function TabLayout() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background?.val,
          borderTopColor: theme.borderColor?.val,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: accent.primary,
        tabBarInactiveTintColor: theme.colorMuted?.val,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon size={24} color={color} active={focused} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '400' }}>
              {t('tabs.home')}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <SettingsIcon size={24} color={color} active={focused} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '400' }}>
              {t('tabs.settings')}
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
