import { useEffect } from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { HomeIcon } from '@/shared/icons/HomeIcon';
import { FeedIcon } from '@/shared/icons/FeedIcon';
// 리포트 탭 복원 시 함께 활성화한다.
// import { ReportIcon } from '@/shared/icons/ReportIcon';
import { SettingsIcon } from '@/shared/icons/SettingsIcon';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { useDatePickerStore } from '@/features/question/stores/useDatePickerStore';
import { formatLocalDate } from '@/shared/utils/date';
import { useFCMReconciliation } from '@/features/notifications/hooks/useFCMReconciliation';
import { setUserId } from '@/platform/firebase';

export default function TabLayout() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation();

  // member 데이터 prefetch (하위 화면에서 캐시된 데이터 사용)
  const { data: member } = useMemberMe();

  useFCMReconciliation();

  // Analytics: 유저 단위 여정 추적을 위해 publicId를 GA4 user_id로 연결
  useEffect(() => {
    if (member?.publicId) {
      setUserId(member.publicId);
    }
  }, [member?.publicId]);

  // tabs 마운트 시 오늘 날짜로 동기화 (앱 시작 시점과 로그인 완료 시점의 날짜가 다를 수 있음)
  useEffect(() => {
    useDatePickerStore.getState().setCurrentDate(formatLocalDate());
  }, []);

  return (
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
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
        name="feed"
        options={{
          title: t('tabs.feed'),
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
      {/* 분석 UI 개편 동안 탭 버튼만 숨긴다. 경로 자동 등록을 막기 위해 선언은 유지한다. */}
      <Tabs.Screen name="analysis" options={{ href: null }} />
      {/* 리포트 탭 복원 시 위 숨김 선언을 제거하고 아래 설정을 활성화한다.
      <Tabs.Screen
        name="analysis"
        options={{
          title: t('tabs.analysis'),
          tabBarIcon: ({ color, focused }) => (
            <ReportIcon size={24} color={color} active={focused} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text style={{ color, fontSize: 10, ...getFontStyle(focused ? '700' : '400') }}>
              {t('tabs.analysis')}
            </Text>
          ),
        }}
      />
      */}
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
