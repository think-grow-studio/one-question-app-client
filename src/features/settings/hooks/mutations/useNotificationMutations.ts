import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/features/settings/api/notificationApi';
import { memberQueryKeys } from '@/features/member/hooks/queries/useMemberQueries';
import { GetMemberResponse, NotificationSetting } from '@/shared/types/api';

interface UpdateTimeInput {
  alarmTime: string;
  timezone: string;
  enabled: boolean;
}

/**
 * 알림 시간 변경 — 낙관적 업데이트.
 * 서버 응답 전에 캐시를 즉시 갱신해 UI를 체감 0ms로 반영하고,
 * 실패 시 이전 상태로 롤백, 성공/실패와 무관하게 최종적으로 서버 truth로 재동기화.
 */
export function useUpdateNotificationTimeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTimeInput) => notificationApi.upsertSetting(input),

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
