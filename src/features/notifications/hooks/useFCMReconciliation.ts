import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { getFCMToken } from '@/services/firebase';
import { recordError } from '@/services/firebase/crashlytics';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { useNotificationStore } from '@/features/notifications/stores/useNotificationStore';
import { notificationApi } from '@/features/notifications/api/notificationApi';
import { getNotificationPermissionStatus } from '@/features/notifications/services/notifications';

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
  const prevEnabledRef = useRef<boolean | null>(null);
  const setting = member?.notificationSetting;
  const enabled = setting?.enabled ?? false;
  // member 로딩 전에는 enabled가 default false라 false→true 전이로 오인되므로,
  // 데이터 로드 이후의 effect run에서만 prevEnabledRef를 갱신한다.
  const isMemberLoaded = !!member;

  useEffect(() => {
    if (!isMemberLoaded) return;

    // race 방어: enabled가 false→true로 전이된 effect 재실행은 useEnableNotificationMutation이
    // 토큰 등록을 처리 중이라는 신호이므로 첫 reconcile을 skip한다. AppState 복귀 시의
    // reconcile은 정상 수행되어야 하므로 이 가드는 effect 진입 1회에만 적용한다.
    // mount 직후 첫 진입은 prevEnabledRef.current === null이라 가드 통과 → reconcile 실행.
    const justEnabled = prevEnabledRef.current === false && enabled === true;
    prevEnabledRef.current = enabled;

    const reconcile = async () => {
      if (!enabled || !setting) return;
      if (isReconciling.current) return;
      isReconciling.current = true;

      try {
        const permissionGranted = await getNotificationPermissionStatus();
        if (!permissionGranted) {
          // 리마인드만 OFF 동기화. 분석 리포트 설정은 사용자 의사로 남겨둔다
          // (권한 재허용 시 pre-prompt/토글 경로가 다시 살림) — PUT 전체 교체라 값 유지 목적의 pass-through.
          await notificationApi.upsertSetting({
            alarmTime: setting.alarmTime,
            timezone: setting.timezone,
            enabled: false,
            analysisReportEnabled:
              setting.analysisReportEnabled ??
              useNotificationStore.getState().analysisReportEnabled,
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

    if (!justEnabled) {
      reconcile();
    }

    let prevState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && prevState !== 'active') {
        reconcile();
      }
      prevState = nextState;
    });

    return () => subscription.remove();
  }, [isMemberLoaded, enabled, setting?.alarmTime, setting?.timezone, queryClient]);
}
