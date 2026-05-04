import { useQuery } from '@tanstack/react-query';

import { memberApi } from '@/features/member/api/memberApi';
import { shouldHideAds } from '@/features/member/constants/permissions';

export const memberQueryKeys = {
  all: ['member'] as const,
  me: () => [...memberQueryKeys.all, 'me'] as const,
};

export function useMemberMe() {
  return useQuery({
    queryKey: memberQueryKeys.me(),
    queryFn: async () => {
      const res = await memberApi.getMe();
      console.log('=== GetMe API Response ===');
      console.log('Full data:', JSON.stringify(res.data, null, 2));
      console.log('Fields:', Object.keys(res.data));
      console.log('cycleStartDate:', res.data.cycleStartDate);
      console.log('==========================');
      return res.data;
    },
    staleTime: 1000 * 60 * 30, // 30분 캐시
  });
}

/**
 * 광고 무료 회원 여부.
 * 광고 노출 정책의 단일 진입점 — 정책 변경 시 이 훅만 수정.
 */
export function useIsAdFreeMember(): boolean {
  const { data: member } = useMemberMe();
  return shouldHideAds(member?.permission);
}
