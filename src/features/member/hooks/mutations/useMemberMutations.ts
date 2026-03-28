import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '@/features/member/api/memberApi';
import { memberQueryKeys } from '@/features/member/hooks/queries/useMemberQueries';
import { LANGUAGE_LOCALE_MAP, type Language } from '@/shared/stores/useLanguageStore';

export function useUpdateLocaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (language: Language) =>
      memberApi.updateMe({ locale: LANGUAGE_LOCALE_MAP[language] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.me() });
    },
  });
}
