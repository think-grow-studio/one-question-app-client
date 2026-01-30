import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionApi } from '../../api/questionApi';
import { questionQueryKeys, getCalendarBaseDate } from '../queries/useQuestionQueries';
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

      // 달력 데이터 갱신 (해당 날짜가 포함된 월의 캐시만)
      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });

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
      // 달력 데이터 갱신 (해당 날짜가 포함된 월의 캐시만)
      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });
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
      // 달력 데이터 갱신 (답변 상태 반영)
      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });
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
      // 달력 데이터 갱신 (답변 수정 반영)
      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });
    },
  });
}
