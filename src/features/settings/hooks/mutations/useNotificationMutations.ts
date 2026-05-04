import { useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/features/settings/api/notificationApi';
import { memberQueryKeys } from '@/features/member/hooks/queries/useMemberQueries';
import { useNotificationStore } from '@/features/settings/stores/useNotificationStore';
import { GetMemberResponse, NotificationSetting } from '@/shared/types/api';

interface UpdateTimeInput {
  token: string;
  alarmTime: string;
  timezone: string;
  enabled: boolean;
}

interface EnableInput {
  token: string;
  alarmTime: string;
  timezone: string;
}

interface DisableInput {
  alarmTime: string;
  timezone: string;
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
 */
export function useUpdateNotificationTimeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTimeInput) => {
      await notificationApi.registerFcmToken(input.token);
      await notificationApi.upsertSetting({
        alarmTime: input.alarmTime,
        timezone: input.timezone,
        enabled: input.enabled,
      });
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: memberQueryKeys.me() });
      const previous = queryClient.getQueryData<GetMemberResponse>(memberQueryKeys.me());

      queryClient.setQueryData<GetMemberResponse>(memberQueryKeys.me(), (old) => {
        if (!old) return old;
        const nextSetting: NotificationSetting = {
          alarmTime: input.alarmTime,
          timezone: input.timezone,
          enabled: old.notificationSetting?.enabled ?? input.enabled,
        };
        return { ...old, notificationSetting: nextSetting };
      });

      return { previous };
    },

    onSuccess: (_data, input) => {
      useNotificationStore.getState().setFcmToken(input.token);
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
      });
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: memberQueryKeys.me() });
      const previous = queryClient.getQueryData<GetMemberResponse>(memberQueryKeys.me());

      patchMemberSetting(queryClient, {
        alarmTime: input.alarmTime,
        timezone: input.timezone,
        enabled: true,
      });

      return { previous };
    },

    onSuccess: (_data, input) => {
      useNotificationStore.getState().setFcmToken(input.token);
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
      }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: memberQueryKeys.me() });
      const previous = queryClient.getQueryData<GetMemberResponse>(memberQueryKeys.me());

      patchMemberSetting(queryClient, {
        alarmTime: input.alarmTime,
        timezone: input.timezone,
        enabled: false,
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
