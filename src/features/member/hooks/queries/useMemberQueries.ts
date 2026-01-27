import { useQuery } from '@tanstack/react-query';

import { memberApi } from '@/features/member/api/memberApi';

export const memberQueryKeys = {
  all: ['member'] as const,
  me: () => [...memberQueryKeys.all, 'me'] as const,
};

export function useMemberMe() {
  return useQuery({
    queryKey: memberQueryKeys.me(),
    queryFn: () => memberApi.getMe().then((res) => res.data),
    staleTime: 1000 * 60 * 30, // 30분 캐시
  });
}
