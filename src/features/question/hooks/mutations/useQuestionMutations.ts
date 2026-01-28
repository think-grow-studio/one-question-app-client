import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionApi } from '../../api/questionApi';
import { questionQueryKeys } from '../queries/useQuestionQueries';

export function useServeDailyQuestion(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => questionApi.serveDailyQuestion(date).then((res) => res.data),
    onSuccess: (_, date) => {
      // 히스토리 캐시 무효화하여 새 질문이 반영되도록
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.all });
      options?.onSuccess?.();
    },
  });
}

export function useReloadQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => questionApi.reloadDailyQuestion(date).then((res) => res.data),
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.daily(date) });
    },
  });
}

export function useCreateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, answer }: { date: string; answer: string }) =>
      questionApi.createAnswer(date, { answer }).then((res) => res.data),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.daily(date) });
      // 히스토리 전체 무효화 (날짜 범위에 따라 다를 수 있으므로)
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.all });
    },
  });
}

export function useUpdateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, answer }: { date: string; answer: string }) =>
      questionApi.updateAnswer(date, { answer }).then((res) => res.data),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.daily(date) });
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.all });
    },
  });
}
