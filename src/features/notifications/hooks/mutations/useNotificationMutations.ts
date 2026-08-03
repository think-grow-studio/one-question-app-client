import { useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/features/notifications/api/notificationApi';
import { memberQueryKeys } from '@/features/member/hooks/queries/useMemberQueries';
import { useNotificationStore } from '@/features/notifications/stores/useNotificationStore';
import { GetMemberResponse, NotificationSetting } from '@/shared/types/api';

// upsertSetting은 전체 교체(PUT)라 모든 입력에 analysisReportEnabled를 실어
// 다른 토글 조작이 분석 리포트 설정을 지우지 않도록 한다.

interface UpdateTimeInput {
  alarmTime: string;
  timezone: string;
  enabled: boolean;
  analysisReportEnabled: boolean;
}

interface EnableInput {
  token: string;
  alarmTime: string;
  timezone: string;
  analysisReportEnabled: boolean;
}

interface DisableInput {
  alarmTime: string;
  timezone: string;
  analysisReportEnabled: boolean;
}

interface AnalysisReportInput {
  alarmTime: string;
  timezone: string;
  enabled: boolean;
  analysisReportEnabled: boolean;
}

function patchMemberSetting(
  queryClient: QueryClient,
  next: NotificationSetting,
) {
  queryClient.setQueryData<GetMemberResponse>(memberQueryKeys.me(), (old) => {
    if (!old) return old;
    return { ...old, notificationSetting: next };
  });
}

/**
 * 알림 시간 변경 — 낙관적 업데이트.
 * 서버 응답 전에 캐시를 즉시 갱신해 UI를 체감 0ms로 반영하고,
 * 실패 시 이전 상태로 롤백, 성공/실패와 무관하게 최종적으로 서버 truth로 재동기화.
 *
 * 토큰은 건드리지 않는다 — 시간 변경은 설정 조작이지 토큰 조작이 아니고,
 * 토큰 정합성은 useFCMReconciliation이 단독으로 책임진다. 여기서 registerFcmToken을
 * 부르면 OS 권한이 없는 상태에서도 토큰이 되살아나 권한 게이트가 뚫린다.
 */
export function useUpdateNotificationTimeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTimeInput) =>
      notificationApi.upsertSetting({
        alarmTime: input.alarmTime,
        timezone: input.timezone,
        enabled: input.enabled,
        analysisReportEnabled: input.analysisReportEnabled,
      }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: memberQueryKeys.me() });
      const previous = queryClient.getQueryData<GetMemberResponse>(memberQueryKeys.me());

      queryClient.setQueryData<GetMemberResponse>(memberQueryKeys.me(), (old) => {
        if (!old) return old;
        const nextSetting: NotificationSetting = {
          alarmTime: input.alarmTime,
          timezone: input.timezone,
          enabled: old.notificationSetting?.enabled ?? input.enabled,
          analysisReportEnabled: input.analysisReportEnabled,
        };
        return { ...old, notificationSetting: nextSetting };
      });

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(memberQueryKeys.me(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.me() });
    },
  });
}

/**
 * 알림 ON — registerFcmToken + upsertSetting(enabled:true) 두 네트워크 호출을 묶고
 * onMutate에서 optimistic flip. 권한·토큰 획득은 선결 조건이라 호출자(useNotificationSettings)
 * 책임으로 분리.
 */
export function useEnableNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EnableInput) => {
      await notificationApi.registerFcmToken(input.token);
      await notificationApi.upsertSetting({
        alarmTime: input.alarmTime,
        timezone: input.timezone,
        enabled: true,
        analysisReportEnabled: input.analysisReportEnabled,
      });
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: memberQueryKeys.me() });
      const previous = queryClient.getQueryData<GetMemberResponse>(memberQueryKeys.me());
      const previousFcmToken = useNotificationStore.getState().fcmToken;

      patchMemberSetting(queryClient, {
        alarmTime: input.alarmTime,
        timezone: input.timezone,
        enabled: true,
        analysisReportEnabled: input.analysisReportEnabled,
      });

      // race 방어: useFCMReconciliation이 optimistic enabled flip을 감지해 reconcile()을
      // 발사하기 전에 store에 새 토큰을 넣어야 sdkToken === storedToken으로 중복 register를 막을 수 있음.
      useNotificationStore.getState().setFcmToken(input.token);

      return { previous, previousFcmToken };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(memberQueryKeys.me(), context.previous);
      }
      if (context) {
        useNotificationStore.getState().setFcmToken(context.previousFcmToken ?? null);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.me() });
    },
  });
}

/**
 * 알림 OFF — upsertSetting(enabled:false)만 호출. 서버가 enabled 플래그로 발송 차단.
 * 토큰 자체는 서버에 남겨두어 재활성화 시 마찰 최소화 (정책 일관).
 */
export function useDisableNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DisableInput) =>
      notificationApi.upsertSetting({
        alarmTime: input.alarmTime,
        timezone: input.timezone,
        enabled: false,
        analysisReportEnabled: input.analysisReportEnabled,
      }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: memberQueryKeys.me() });
      const previous = queryClient.getQueryData<GetMemberResponse>(memberQueryKeys.me());

      patchMemberSetting(queryClient, {
        alarmTime: input.alarmTime,
        timezone: input.timezone,
        enabled: false,
        analysisReportEnabled: input.analysisReportEnabled,
      });

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(memberQueryKeys.me(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.me() });
    },
  });
}

/**
 * AI 분석 리포트 알림 토글 — 낙관적 업데이트.
 * 서버 캐시와 로컬 store(fallback 진실원)를 함께 갱신하고, 실패 시 둘 다 롤백.
 * 서버가 필드를 아직 지원하지 않아 응답에 없더라도 로컬 store가 UI를 지탱한다.
 * ON 전환의 권한·토큰 선결 조건은 호출자(useNotificationSettings) 책임.
 */
export function useUpdateAnalysisReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AnalysisReportInput) =>
      notificationApi.upsertSetting({
        alarmTime: input.alarmTime,
        timezone: input.timezone,
        enabled: input.enabled,
        analysisReportEnabled: input.analysisReportEnabled,
      }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: memberQueryKeys.me() });
      const previous = queryClient.getQueryData<GetMemberResponse>(memberQueryKeys.me());
      const previousLocal = useNotificationStore.getState().analysisReportEnabled;

      queryClient.setQueryData<GetMemberResponse>(memberQueryKeys.me(), (old) => {
        if (!old?.notificationSetting) return old;
        return {
          ...old,
          notificationSetting: {
            ...old.notificationSetting,
            analysisReportEnabled: input.analysisReportEnabled,
          },
        };
      });
      useNotificationStore.getState().setAnalysisReportEnabled(input.analysisReportEnabled);

      return { previous, previousLocal };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(memberQueryKeys.me(), context.previous);
      }
      if (context) {
        useNotificationStore.getState().setAnalysisReportEnabled(context.previousLocal ?? true);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.me() });
    },
  });
}
