import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '@/features/settings/stores/useNotificationStore';
import {
  requestNotificationPermission,
} from '@/features/settings/services/notifications';
import { getFCMToken } from '@/services/firebase';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import {
  useUpdateNotificationTimeMutation,
  useEnableNotificationMutation,
  useDisableNotificationMutation,
} from './mutations/useNotificationMutations';

const DEFAULT_ALARM_TIME = '21:00';
const TOGGLE_INTERACTION_LOCK_MS = 500;

function toAlarmTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function parseAlarmTime(alarmTime: string): [number, number] {
  const [h, m] = alarmTime.split(':').map(Number);
  return [h, m];
}

export function useNotificationSettings() {
  const fcmToken = useNotificationStore((s) => s.fcmToken);
  const { data: memberData } = useMemberMe();
  const updateTimeMutation = useUpdateNotificationTimeMutation();
  const enableMutation = useEnableNotificationMutation();
  const disableMutation = useDisableNotificationMutation();
  const isToggleLockedRef = useRef(false);
  const toggleLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isToggleLocked, setIsToggleLocked] = useState(false);

  const setting = memberData?.notificationSetting;
  const isEnabled = setting?.enabled ?? false;
  const alarmTime = setting?.alarmTime ?? DEFAULT_ALARM_TIME;
  const timezone = setting?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [hour, minute] = parseAlarmTime(alarmTime);
  const isTogglingNotification = enableMutation.isPending || disableMutation.isPending;

  useEffect(() => {
    return () => {
      if (toggleLockTimeoutRef.current) {
        clearTimeout(toggleLockTimeoutRef.current);
      }
      isToggleLockedRef.current = false;
    };
  }, []);

  const toggleNotification = useCallback(async () => {
    if (isToggleLockedRef.current) return;

    isToggleLockedRef.current = true;
    setIsToggleLocked(true);
    toggleLockTimeoutRef.current = setTimeout(() => {
      isToggleLockedRef.current = false;
      setIsToggleLocked(false);
      toggleLockTimeoutRef.current = null;
    }, TOGGLE_INTERACTION_LOCK_MS);

    if (!isEnabled) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      const token = await getFCMToken();
      if (!token) {
        console.error('[Notifications] FCM 토큰 발급 실패');
        return;
      }

      enableMutation.mutate({ token, alarmTime, timezone });
    } else {
      disableMutation.mutate({ alarmTime, timezone });
    }
  }, [isEnabled, alarmTime, timezone, enableMutation, disableMutation]);

  const updateNotificationTime = useCallback(
    async (newHour: number, newMinute: number) => {
      const newAlarmTime = toAlarmTime(newHour, newMinute);
      const token = useNotificationStore.getState().fcmToken ?? (await getFCMToken());
      if (!token) {
        console.error('[Notifications] FCM 토큰 없음 - 시간 변경 중단');
        return;
      }
      updateTimeMutation.mutate({
        token,
        alarmTime: newAlarmTime,
        timezone,
        enabled: isEnabled,
      });
    },
    [isEnabled, timezone, updateTimeMutation]
  );

  return {
    isEnabled,
    hour,
    minute,
    fcmToken,
    toggleNotification,
    updateNotificationTime,
    isUpdatingTime: updateTimeMutation.isPending,
    isTogglingNotification,
    isToggleInteractionDisabled: isToggleLocked || isTogglingNotification,
  };
}
