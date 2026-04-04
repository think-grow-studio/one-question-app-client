import { useMutation } from '@tanstack/react-query';
import { questionLikeApi } from '../../api/questionLikeApi';

export function useToggleQuestionLike() {
  return useMutation({
    mutationFn: (questionId: number) =>
      questionLikeApi.toggleLike(questionId).then((res) => res.data),
  });
}
