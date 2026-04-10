import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiErrorResponse } from '@/shared/types/api';
import { questionApi } from '../../api/questionApi';
import { questionQueryKeys, getCalendarBaseDate } from '../queries/useQuestionQueries';
import {
  fromServeDailyQuestion,
  type DailyQuestionDomain,
} from '../../domain/questionDomain';
import type {
  CheckCandidateCycleResponse,
  ServeDailyQuestionResponse,
} from '../../types/api';

export function useServeDailyQuestion(options?: {
  onSuccess?: (data: ServeDailyQuestionResponse, variables: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => questionApi.serveDailyQuestion(date).then((res) => res.data),
    onSuccess: (data, date) => {
      queryClient.setQueryData(questionQueryKeys.daily(date), fromServeDailyQuestion(date, data));

      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });

      options?.onSuccess?.(data, date);
    },
  });
}

export function useReloadQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => questionApi.reloadDailyQuestion(date).then((res) => res.data),
    onSuccess: (data, date) => {
      queryClient.setQueryData(questionQueryKeys.daily(date), fromServeDailyQuestion(date, data));

      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });
    },
  });
}

export function useSelectQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, questionId }: { date: string; questionId: number }) =>
      questionApi.selectQuestion(date, { questionId }).then((res) => res.data),

    onMutate: async ({ date, questionId }) => {
      await queryClient.cancelQueries({ queryKey: questionQueryKeys.daily(date) });
      const previousData = queryClient.getQueryData<DailyQuestionDomain>(questionQueryKeys.daily(date));

      queryClient.setQueryData<DailyQuestionDomain>(questionQueryKeys.daily(date), (prev) => {
        if (!prev?.question) {
          return prev;
        }

        const selectedCandidate = prev.question.candidates.find(
          (candidate) => candidate.questionId === questionId
        );

        if (!selectedCandidate) {
          return prev;
        }

        return {
          ...prev,
          question: {
            ...prev.question,
            questionId: selectedCandidate.questionId,
            content: selectedCandidate.content,
            description: selectedCandidate.description,
            candidates: prev.question.candidates.map((candidate) => ({
              ...candidate,
              selected: candidate.questionId === questionId,
            })),
          },
        };
      });

      return { previousData };
    },

    onError: (_error, { date }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(questionQueryKeys.daily(date), context.previousData);
      }
    },

    onSuccess: (data, { date }) => {
      queryClient.setQueryData(questionQueryKeys.daily(date), fromServeDailyQuestion(date, data));

      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });
    },
  });
}

export function useCheckCandidateCycle() {
  return useMutation<
    CheckCandidateCycleResponse,
    ApiErrorResponse,
    { date: string; questionId: number }
  >({
    mutationFn: ({ date, questionId }) =>
      questionApi.checkCandidateCycle(date, { questionId }).then((res) => res.data),
  });
}

export function useCreateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, answer, publish }: { date: string; answer: string; publish?: boolean }) =>
      questionApi.createAnswer(date, { answer, publish }).then((res) => res.data),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.daily(date) });

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

      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });
    },
  });
}
