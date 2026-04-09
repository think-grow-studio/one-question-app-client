import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionApi } from '../../api/questionApi';
import { questionQueryKeys, getCalendarBaseDate } from '../queries/useQuestionQueries';
import type { ServeDailyQuestionResponse } from '@/shared/types/api';
import { fromServeDailyQuestion, type DailyQuestionDomain } from '../../domain/questionDomain';

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
    onSuccess: (data, date) => {
      // API 응답을 도메인 모델로 변환하여 캐시 업데이트
      const domainData = fromServeDailyQuestion(date, data);
      queryClient.setQueryData(questionQueryKeys.daily(date), domainData);

      // 달력 데이터 갱신 (해당 날짜가 포함된 월의 캐시만)
      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });
    },
  });
}

export function useSelectCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, candidateId }: { date: string; candidateId: number }) =>
      questionApi.selectCandidate(date, candidateId).then((res) => res.data),

    onMutate: async ({ date, candidateId }) => {
      await queryClient.cancelQueries({ queryKey: questionQueryKeys.daily(date) });
      const previousData = queryClient.getQueryData<DailyQuestionDomain>(questionQueryKeys.daily(date));

      queryClient.setQueryData<DailyQuestionDomain>(questionQueryKeys.daily(date), (prev) => {
        if (!prev?.question) return prev;
        const selected = prev.question.candidates.find((c) => c.candidateId === candidateId);
        if (!selected) return prev;
        return {
          ...prev,
          question: {
            ...prev.question,
            questionId: selected.questionId,
            content: selected.content,
            description: selected.description,
            candidates: prev.question.candidates.map((c) => ({
              ...c,
              isSelected: c.candidateId === candidateId,
            })),
          },
        };
      });

      return { previousData };
    },

    onError: (_err, { date }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(questionQueryKeys.daily(date), context.previousData);
      }
    },

    onSuccess: (data, { date }) => {
      queryClient.setQueryData<DailyQuestionDomain>(questionQueryKeys.daily(date), (prev) => {
        if (!prev?.question) return prev;
        return {
          ...prev,
          question: {
            ...prev.question,
            questionId: data.questionId,
            content: data.content,
            description: data.description,
            candidates: prev.question.candidates.map((c) => ({
              ...c,
              isSelected: c.candidateId === data.selectedCandidateId,
            })),
          },
        };
      });
    },
  });
}

export function useCreateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, answer, publish }: { date: string; answer: string; publish?: boolean }) =>
      questionApi.createAnswer(date, { answer, publish }).then((res) => res.data),
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
    mutationFn: ({ date, answer, publish }: { date: string; answer: string; publish?: boolean }) =>
      questionApi.updateAnswer(date, { answer, publish }).then((res) => res.data),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.daily(date) });
      // 달력 데이터 갱신 (답변 수정 반영)
      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });
    },
  });
}
