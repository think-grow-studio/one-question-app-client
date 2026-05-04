import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '@/features/settings/stores/useNotificationStore';
import { requestNotificationPermission } from '@/features/settings/services/notifications';
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
  // 권한 다이얼로그 → 토큰 획득 구간을 mutation.isPending 과 이어붙이기 위한 로컬 pending.
  // 서버가 원거리라 네트워크 구간이 길어 사용자 체감 끊김을 막는 용도.
  const [isPreparingEnable, setIsPreparingEnable] = useState(false);

  const setting = memberData?.notificationSetting;
  const isEnabled = setting?.enabled ?? false;
  const alarmTime = setting?.alarmTime ?? DEFAULT_ALARM_TIME;
  const timezone = setting?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [hour, minute] = parseAlarmTime(alarmTime);
  const isTogglingNotification =
    isPreparingEnable || enableMutation.isPending || disableMutation.isPending;

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
      // 권한·토큰은 선결 조건 — 사용자 결정/네이티브 단계라 optimistic 대상이 아님.
      // mutation은 네트워크 단계만 맡고, onMutate에서 그때 UI flip.
      // 권한 거부 시 requestNotificationPermission 내부에서 Alert을 띄우므로
      // component가 reason='permission'에 추가 dialog를 띄우지 않는 약속.
      // isPreparingEnable: 탭 직후 → mutate() 직전까지 spinner 끊김 방지 (mutate 호출 시
      // onMutate가 동기 발동하며 isPending=true 로 자연스럽게 인계됨).
      setIsPreparingEnable(true);
      try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return { success: false, reason: 'permission' };

        const token = await getFCMToken();
        if (!token) return { success: false, reason: 'token' };

        enableMutation.mutate({ token, alarmTime, timezone });
        return { success: true };
      } finally {
        setIsPreparingEnable(false);
      }
    } else {
      disableMutation.mutate({ alarmTime, timezone });
      return { success: true };
    }
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
