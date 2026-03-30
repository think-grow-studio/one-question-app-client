import { useEffect } from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { HomeIcon } from '@/shared/icons/HomeIcon';
import { FeedIcon } from '@/shared/icons/FeedIcon';
import { SettingsIcon } from '@/shared/icons/SettingsIcon';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { ENABLE_PUBLIC_FEED } from '@/shared/constants/features';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { useDatePickerStore } from '@/features/question/stores/useDatePickerStore';
import { formatLocalDate } from '@/shared/utils/date';

export default function TabLayout() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation();

  // member 데이터 prefetch (하위 화면에서 캐시된 데이터 사용)
  useMemberMe();

  // tabs 마운트 시 오늘 날짜로 동기화 (앱 시작 시점과 로그인 완료 시점의 날짜가 다를 수 있음)
  useEffect(() => {
    useDatePickerStore.getState().setCurrentDate(formatLocalDate());
  }, []);

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
            <Text style={{ color, fontSize: 10, ...getFontStyle(focused ? '700' : '400') }}>
              {t('tabs.home')}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: t('tabs.feed'),
          href: ENABLE_PUBLIC_FEED ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <FeedIcon size={24} color={color} active={focused} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text style={{ color, fontSize: 10, ...getFontStyle(focused ? '700' : '400') }}>
              {t('tabs.feed')}
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
            <Text style={{ color, fontSize: 10, ...getFontStyle(focused ? '700' : '400') }}>
              {t('tabs.settings')}
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
