import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { getFCMToken } from '@/services/firebase';
import { recordError } from '@/services/firebase/crashlytics';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { useNotificationStore } from '@/features/settings/stores/useNotificationStore';
import { notificationApi } from '@/features/settings/api/notificationApi';
import { getNotificationPermissionStatus } from '@/features/settings/services/notifications';

/**
 * FCM 토큰 / OS 권한 / 서버 설정의 정합성을 앱 진입·포그라운드 복귀 시 맞춘다.
 * - SDK 토큰 != store.fcmToken 이면 재등록 (stale token 복구)
 * - OS 권한 denied 이면 서버 enabled:false 동기화
 * enabled가 false거나 토큰이 일치하면 no-op.
 */
export function useFCMReconciliation() {
  const { data: member } = useMemberMe();
  const queryClient = useQueryClient();
  const isReconciling = useRef(false);
  const setting = member?.notificationSetting;
  const enabled = setting?.enabled ?? false;

  useEffect(() => {
    const reconcile = async () => {
      if (!enabled || !setting) return;
      if (isReconciling.current) return;
      isReconciling.current = true;

      try {
        const permissionGranted = await getNotificationPermissionStatus();
        if (!permissionGranted) {
          await notificationApi.upsertSetting({
            alarmTime: setting.alarmTime,
            timezone: setting.timezone,
            enabled: false,
          });
          await queryClient.invalidateQueries({ queryKey: ['member', 'me'] });
          return;
        }

        const sdkToken = await getFCMToken();
        if (!sdkToken) return;

        const storedToken = useNotificationStore.getState().fcmToken;
        if (sdkToken === storedToken) return;

        await notificationApi.registerFcmToken(sdkToken);
        useNotificationStore.getState().setFcmToken(sdkToken);
      } catch (e) {
        console.warn('[FCM Reconcile] 실패:', e);
        if (!__DEV__) {
          const err = e instanceof Error ? e : new Error(String(e));
          recordError(err, 'useFCMReconciliation');
        }
      } finally {
        isReconciling.current = false;
      }
    };

    reconcile();

    let prevState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && prevState !== 'active') {
        reconcile();
      }
      prevState = nextState;
    });

    return () => subscription.remove();
  }, [enabled, setting?.alarmTime, setting?.timezone, queryClient]);
}
