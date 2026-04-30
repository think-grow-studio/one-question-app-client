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

export type NotificationActionFailureReason = 'permission' | 'token' | 'network';

export type NotificationActionResult =
  | { success: true }
  | { success: false; reason: NotificationActionFailureReason };

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

  const toggleNotification = useCallback(async (): Promise<NotificationActionResult> => {
    if (isToggleLockedRef.current) return { success: true };

    isToggleLockedRef.current = true;
    setIsToggleLocked(true);
    toggleLockTimeoutRef.current = setTimeout(() => {
      isToggleLockedRef.current = false;
      setIsToggleLocked(false);
      toggleLockTimeoutRef.current = null;
    }, TOGGLE_INTERACTION_LOCK_MS);

    if (!isEnabled) {
      const hasPermission = await requestNotificationPermission();
      // 권한 거부는 requestNotificationPermission 내부 Alert으로 안내됨
      // → component 레벨에서 추가 dialog 띄우지 않도록 'permission' reason 반환
      if (!hasPermission) return { success: false, reason: 'permission' };

      const token = await getFCMToken();
      if (!token) return { success: false, reason: 'token' };

      enableMutation.mutate({ token, alarmTime, timezone });
    } else {
      disableMutation.mutate({ alarmTime, timezone });
    }
    return { success: true };
  }, [isEnabled, alarmTime, timezone, enableMutation, disableMutation]);

  const updateNotificationTime = useCallback(
    async (newHour: number, newMinute: number): Promise<NotificationActionResult> => {
      const newAlarmTime = toAlarmTime(newHour, newMinute);
      const token = useNotificationStore.getState().fcmToken ?? (await getFCMToken());
      if (!token) return { success: false, reason: 'token' };
      updateTimeMutation.mutate({
        token,
        alarmTime: newAlarmTime,
        timezone,
        enabled: isEnabled,
      });
      return { success: true };
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
