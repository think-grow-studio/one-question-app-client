import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionApi } from '../../api/questionApi';
import { questionQueryKeys } from '../queries/useQuestionQueries';
import type { ServeDailyQuestionResponse } from '@/types/api';
import { fromServeDailyQuestion } from '../../domain/questionDomain';

export function useServeDailyQuestion(options?: {
  onSuccess?: (data: ServeDailyQuestionResponse, variables: string) => void
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => questionApi.serveDailyQuestion(date).then((res) => res.data),
    onSuccess: (data, date) => {
      // API 응답을 도메인 모델로 변환하여 캐시 업데이트
      const domainData = fromServeDailyQuestion(date, data);
      queryClient.setQueryData(questionQueryKeys.daily(date), domainData);

      // 외부 콜백 호출 (추가 작업이 필요한 경우)
      options?.onSuccess?.(data, date);
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
