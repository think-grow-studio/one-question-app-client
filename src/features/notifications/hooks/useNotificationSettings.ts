import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '@/features/notifications/stores/useNotificationStore';
import { requestNotificationPermission } from '@/features/notifications/services/notifications';
import { ensurePushTokenRegistered } from '@/features/notifications/services/pushToken';
import { getFCMToken } from '@/platform/firebase';
import { useMemberMe } from '@/features/member/public';
import {
  useUpdateNotificationTimeMutation,
  useEnableNotificationMutation,
  useDisableNotificationMutation,
  useUpdateAnalysisReportMutation,
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

/**
 * AI 분석 리포트 알림의 유효 값.
 * 서버가 필드를 지원하면 서버 truth, 아니면 로컬 persist 값 (기본 ON).
 */
export function useAnalysisReportEnabled(): boolean {
  const local = useNotificationStore((s) => s.analysisReportEnabled);
  const { data: memberData } = useMemberMe();
  return memberData?.notificationSetting?.analysisReportEnabled ?? local;
}

export function useNotificationSettings() {
  const fcmToken = useNotificationStore((s) => s.fcmToken);
  const { data: memberData } = useMemberMe();
  const analysisReportEnabled = useAnalysisReportEnabled();
  const updateTimeMutation = useUpdateNotificationTimeMutation();
  const enableMutation = useEnableNotificationMutation();
  const disableMutation = useDisableNotificationMutation();
  const analysisReportMutation = useUpdateAnalysisReportMutation();
  // 리마인드 토글과 동일한 이유의 로컬 pending (권한·토큰 단계 spinner 끊김 방지)
  const [isPreparingAnalysisEnable, setIsPreparingAnalysisEnable] = useState(false);
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
  // Switch에 표시할 optimistic value.
  // - isEnabled: 서버 truth (enable mutation onMutate에서 즉시 true로 패치됨)
  // - isPreparingEnable: 토글 탭 직후 ~ mutate() 호출 직전 구간을 메움 (권한·토큰 단계)
  // → 사용자가 토글을 누른 순간부터 ON으로 보이고, 권한 거부 시에만 OFF로 복귀
  const displayedIsEnabled = isEnabled || isPreparingEnable;

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

        enableMutation.mutate({ token, alarmTime, timezone, analysisReportEnabled });
        return { success: true };
      } finally {
        setIsPreparingEnable(false);
      }
    } else {
      disableMutation.mutate({ alarmTime, timezone, analysisReportEnabled });
      return { success: true };
    }
  }, [isEnabled, alarmTime, timezone, analysisReportEnabled, enableMutation, disableMutation]);

  const toggleAnalysisReport = useCallback(async (): Promise<NotificationActionResult> => {
    if (!analysisReportEnabled) {
      // ON 전환 — 리마인드 토글과 동일하게 권한·토큰이 선결 조건.
      // 권한 거부 시 requestNotificationPermission 내부의 Alert이 안내를 담당한다.
      setIsPreparingAnalysisEnable(true);
      try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return { success: false, reason: 'permission' };

        const registered = await ensurePushTokenRegistered();
        if (!registered) return { success: false, reason: 'token' };

        analysisReportMutation.mutate({
          alarmTime,
          timezone,
          enabled: isEnabled,
          analysisReportEnabled: true,
        });
        return { success: true };
      } finally {
        setIsPreparingAnalysisEnable(false);
      }
    } else {
      analysisReportMutation.mutate({
        alarmTime,
        timezone,
        enabled: isEnabled,
        analysisReportEnabled: false,
      });
      return { success: true };
    }
  }, [analysisReportEnabled, isEnabled, alarmTime, timezone, analysisReportMutation]);

  const updateNotificationTime = useCallback(
    async (newHour: number, newMinute: number): Promise<NotificationActionResult> => {
      // 토큰을 요구하지 않는다 — 시간 변경은 설정 조작이고, 토큰은 reconcile 소관.
      updateTimeMutation.mutate({
        alarmTime: toAlarmTime(newHour, newMinute),
        timezone,
        enabled: isEnabled,
        analysisReportEnabled,
      });
      return { success: true };
    },
    [isEnabled, timezone, analysisReportEnabled, updateTimeMutation]
  );

  const isTogglingAnalysisReport =
    isPreparingAnalysisEnable || analysisReportMutation.isPending;
  // 리마인드 토글과 동일한 optimistic 표시 규칙 (onMutate에서 로컬 store가 즉시 flip됨)
  const displayedAnalysisReportEnabled = analysisReportEnabled || isPreparingAnalysisEnable;

  return {
    isEnabled,
    displayedIsEnabled,
    hour,
    minute,
    fcmToken,
    toggleNotification,
    updateNotificationTime,
    isUpdatingTime: updateTimeMutation.isPending,
    isTogglingNotification,
    isToggleInteractionDisabled: isToggleLocked || isTogglingNotification,
    analysisReportEnabled,
    displayedAnalysisReportEnabled,
    toggleAnalysisReport,
    isTogglingAnalysisReport,
  };
}
