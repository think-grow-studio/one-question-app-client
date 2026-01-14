import { Tabs } from 'expo-router';
import { useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';

export default function TabLayout() {
  const theme = useTheme();
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
        tabBarActiveTintColor: theme.primary?.val,
        tabBarInactiveTintColor: theme.colorMuted?.val,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <Text fontSize={24} color={color}>
              🏠
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => (
            <Text fontSize={24} color={color}>
              ⚙️
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
