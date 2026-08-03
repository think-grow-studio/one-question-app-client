import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  getNotificationPermissionState,
  type NotificationPermissionState,
} from '@/features/notifications/services/notifications';

/**
 * OS 알림 권한 상태. 마운트 시 + 포그라운드 복귀 시 재확인한다
 * (사용자가 시스템 설정에서 바꾸고 돌아오는 경우 반영).
 * null = 아직 확인 전 — 배너 깜빡임 방지를 위해 미표시로 취급할 것.
 *
 * 불리언이 아니라 3-상태인 이유는 `NotificationPermissionState` 주석 참고:
 * 'undetermined'를 'denied'로 취급하면 설정 앱의 없는 항목으로 안내하게 된다.
 */
export function useNotificationPermission(): { state: NotificationPermissionState | null } {
  const [state, setState] = useState<NotificationPermissionState | null>(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const next = await getNotificationPermissionState();
      if (mounted) setState(next);
    };

    check();
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') check();
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return { state };
}
