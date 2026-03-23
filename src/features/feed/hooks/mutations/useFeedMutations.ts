import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedApi } from '../../api/feedApi';
import { feedQueryKeys } from '../queries/useFeedQueries';
import { questionQueryKeys } from '@/features/question/hooks/queries/useQuestionQueries';

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedId: number) =>
      feedApi.toggleLike(feedId).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: feedQueryKeys.detail(data.feedId),
      });
      queryClient.invalidateQueries({
        queryKey: feedQueryKeys.list(),
      });
    },
  });
}

export function useTogglePublic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dailyAnswerId: number) =>
      feedApi.togglePublic(dailyAnswerId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: questionQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: feedQueryKeys.all,
      });
    },
  });
}
