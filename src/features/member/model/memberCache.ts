import type { QueryClient } from '@tanstack/react-query';
import { memberQueryKeys } from '../hooks/queries/useMemberQueries';
import type { GetMemberResponse, NotificationSetting } from '@/features/member/types/api';

export type MemberMeSnapshot = GetMemberResponse | undefined;

/** 진행 중인 me 쿼리를 취소하고 optimistic update 롤백용 스냅샷을 반환한다. */
export async function snapshotMemberMe(queryClient: QueryClient): Promise<MemberMeSnapshot> {
  await queryClient.cancelQueries({ queryKey: memberQueryKeys.me() });
  return queryClient.getQueryData<GetMemberResponse>(memberQueryKeys.me());
}

/** snapshotMemberMe로 얻은 스냅샷으로 롤백한다 (스냅샷이 없으면 no-op). */
export function restoreMemberMe(queryClient: QueryClient, snapshot: MemberMeSnapshot): void {
  if (snapshot) queryClient.setQueryData(memberQueryKeys.me(), snapshot);
}

/** notificationSetting 전체를 교체한다 (캐시가 비어있으면 no-op). */
export function patchMemberNotificationSetting(
  queryClient: QueryClient,
  next: NotificationSetting
): void {
  queryClient.setQueryData<GetMemberResponse>(memberQueryKeys.me(), (old) => {
    if (!old) return old;
    return { ...old, notificationSetting: next };
  });
}

/** notificationSetting.analysisReportEnabled 필드만 patch한다. */
export function patchMemberAnalysisReportEnabled(
  queryClient: QueryClient,
  analysisReportEnabled: boolean
): void {
  queryClient.setQueryData<GetMemberResponse>(memberQueryKeys.me(), (old) => {
    if (!old?.notificationSetting) return old;
    return {
      ...old,
      notificationSetting: { ...old.notificationSetting, analysisReportEnabled },
    };
  });
}

/** 캐시된 me 응답에서 notificationSetting만 동기적으로 읽는다 (구독 없이 1회성 읽기용). */
export function readMemberNotificationSetting(
  queryClient: QueryClient
): NotificationSetting | undefined {
  return (
    queryClient.getQueryData<GetMemberResponse>(memberQueryKeys.me())?.notificationSetting ??
    undefined
  );
}

export function invalidateMemberMe(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: memberQueryKeys.me() });
}
