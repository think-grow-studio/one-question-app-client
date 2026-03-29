import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedApi } from '../../api/feedApi';
import { feedQueryKeys } from '../queries/useFeedQueries';

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answerPostId: number) =>
      feedApi.toggleLike(answerPostId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: feedQueryKeys.list(),
      });
    },
  });
}
