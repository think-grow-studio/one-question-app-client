import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/features/settings/stores/useNotificationStore';
import {
  requestNotificationPermission,
} from '@/features/settings/services/notifications';
import { notificationApi } from '@/features/settings/api/notificationApi';
import { getFCMToken } from '@/services/firebase';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';

const DEFAULT_ALARM_TIME = '21:00';

function toAlarmTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function parseAlarmTime(alarmTime: string): [number, number] {
  const [h, m] = alarmTime.split(':').map(Number);
  return [h, m];
}

export function useNotificationSettings() {
  const { fcmToken, setFcmToken } = useNotificationStore();
  const { data: memberData } = useMemberMe();
  const queryClient = useQueryClient();

  const setting = memberData?.notificationSetting;
  const isEnabled = setting?.enabled ?? false;
  const alarmTime = setting?.alarmTime ?? DEFAULT_ALARM_TIME;
  const timezone = setting?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [hour, minute] = parseAlarmTime(alarmTime);

  const toggleNotification = useCallback(async () => {
    if (!isEnabled) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      const token = await getFCMToken();
      if (!token) {
        console.error('[Notifications] FCM 토큰 발급 실패');
        return;
      }

      try {
        await notificationApi.registerFcmToken(token);
        await notificationApi.upsertSetting({ alarmTime, timezone, enabled: true });
        setFcmToken(token);
        await queryClient.invalidateQueries({ queryKey: ['member', 'me'] });
      } catch {
        // 전역 에러 핸들러가 처리
      }
    } else {
      try {
        await notificationApi.upsertSetting({ alarmTime, timezone, enabled: false });
        await queryClient.invalidateQueries({ queryKey: ['member', 'me'] });
      } catch {
        // 전역 에러 핸들러가 처리
      }
    }
  }, [isEnabled, alarmTime, timezone, setFcmToken, queryClient]);

  const updateNotificationTime = useCallback(
    async (newHour: number, newMinute: number) => {
      const newAlarmTime = toAlarmTime(newHour, newMinute);
      try {
        await notificationApi.upsertSetting({ alarmTime: newAlarmTime, timezone, enabled: isEnabled });
        await queryClient.invalidateQueries({ queryKey: ['member', 'me'] });
      } catch {
        // 전역 에러 핸들러가 처리
      }
    },
    [isEnabled, timezone, queryClient]
  );

  return {
    isEnabled,
    hour,
    minute,
    fcmToken,
    toggleNotification,
    updateNotificationTime,
  };
}
