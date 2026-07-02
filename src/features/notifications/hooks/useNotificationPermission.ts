import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getNotificationPermissionStatus } from '@/features/notifications/services/notifications';

/**
 * OS 알림 권한 상태. 마운트 시 + 포그라운드 복귀 시 재확인한다
 * (사용자가 시스템 설정에서 바꾸고 돌아오는 경우 반영).
 * null = 아직 확인 전 — 배너 깜빡임 방지를 위해 미표시로 취급할 것.
 */
export function useNotificationPermission(): { granted: boolean | null } {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const ok = await getNotificationPermissionStatus();
      if (mounted) setGranted(ok);
    };

    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return { granted };
}
