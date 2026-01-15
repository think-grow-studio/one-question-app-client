import { useCallback, useEffect } from 'react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  scheduleDailyNotification,
  cancelDailyNotification,
} from '@/services/notifications';

export function useNotificationSettings() {
  const { isEnabled, hour, minute, setEnabled, setTime } = useNotificationStore();

  // 알림 활성화/비활성화 토글
  const toggleNotification = useCallback(async () => {
    if (!isEnabled) {
      // 활성화하려는 경우 권한 요청
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        await scheduleDailyNotification(hour, minute);
        setEnabled(true);
      }
    } else {
      // 비활성화
      await cancelDailyNotification();
      setEnabled(false);
    }
  }, [isEnabled, hour, minute, setEnabled]);

  // 알림 시간 변경
  const updateNotificationTime = useCallback(
    async (newHour: number, newMinute: number) => {
      setTime(newHour, newMinute);

      // 이미 활성화된 경우 새 시간으로 다시 스케줄
      if (isEnabled) {
        await scheduleDailyNotification(newHour, newMinute);
      }
    },
    [isEnabled, setTime]
  );

  // 앱 시작 시 알림 상태 동기화
  useEffect(() => {
    const syncNotificationState = async () => {
      if (isEnabled) {
        const hasPermission = await getNotificationPermissionStatus();
        if (hasPermission) {
          // 알림 재스케줄 (앱 재시작 시)
          await scheduleDailyNotification(hour, minute);
        } else {
          // 권한이 없으면 비활성화
          setEnabled(false);
        }
      }
    };

    syncNotificationState();
  }, []);

  return {
    isEnabled,
    hour,
    minute,
    toggleNotification,
    updateNotificationTime,
  };
}
