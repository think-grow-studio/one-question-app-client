import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { ApiErrorResponse } from '@/platform/http/types';
import { questionApi } from '../../api/questionApi';
import { questionQueryKeys, getCalendarBaseDate } from '../queries/useQuestionQueries';
import {
  fromServeDailyQuestion,
  type DailyQuestionDomain,
} from '../../domain/questionDomain';
import type {
  CheckCandidateCycleResponse,
  CreateAnswerResponse,
  GetQuestionHistoryResponse,
  ServeDailyQuestionResponse,
  UpdateAnswerResponse,
} from '../../types/api';

/**
 * 답변 생성/수정 결과를 timeline 페이지 캐시에 수술적으로 반영 (refetch 없이 즉시 갱신).
 * 해당 날짜가 로드된 페이지에 없으면(미로드 범위 등) 표준 invalidate로 폴백.
 */
function applyAnswerToTimeline(
  queryClient: QueryClient,
  date: string,
  answer: CreateAnswerResponse | UpdateAnswerResponse
) {
  let patched = false;

  queryClient.setQueryData<InfiniteData<GetQuestionHistoryResponse>>(
    questionQueryKeys.timeline,
    (prev) => {
      if (!prev) return prev;

      const pages = prev.pages.map((page) => {
        const index = page.histories.findIndex((h) => h.date === date);
        if (index === -1) return page;

        patched = true;
        const histories = [...page.histories];
        histories[index] = {
          ...histories[index],
          status: 'ANSWERED',
          answer: {
            dailyAnswerId: answer.dailyAnswerId,
            content: answer.content,
            answeredAt: answer.answeredAt,
          },
        };
        return { ...page, histories };
      });

      return { ...prev, pages };
    }
  );

  if (!patched) {
    queryClient.invalidateQueries({ queryKey: questionQueryKeys.timeline });
  }
}

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
      // 새 기록이 생긴 날 → 타임라인 목록에 합류해야 함
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.timeline });

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
      // 질문 내용 변경 → 타임라인 행 갱신
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.timeline });
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
            liked: false,
            likeCount: selectedCandidate.likeCount,
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
      // 질문 선택 변경 → 타임라인 행 갱신
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.timeline });
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

export function useCreateAnswer(options?: {
  /**
   * QUESTION-004(중복 답변) 발생 시 호출. 표시 책임은 호출자에게 위임.
   * @param info.message - 서버가 내려준 에러 메시지 (dialog 본문에 사용)
   * @param info.syncQueries - 사용자가 dialog 확인 후 호출할 캐시 동기화 함수
   *   (해당 날짜 daily + calendar invalidate → 상대편 답변으로 history 갱신)
   */
  onDuplicateAnswer?: (info: { message: string; syncQueries: () => void }) => void;
}) {
  const queryClient = useQueryClient();

  const invalidateDateQueries = (date: string) => {
    queryClient.invalidateQueries({ queryKey: questionQueryKeys.daily(date) });
    queryClient.invalidateQueries({
      queryKey: questionQueryKeys.calendar(getCalendarBaseDate(date)),
    });
  };

  return useMutation<
    CreateAnswerResponse,
    ApiErrorResponse,
    { date: string; answer: string }
  >({
    mutationFn: ({ date, answer }) =>
      questionApi.createAnswer(date, { answer }).then((res) => res.data),
    onSuccess: (data, { date }) => {
      invalidateDateQueries(date);
      // 타임라인은 응답으로 직접 패치 (refetch 없이 즉시 반영)
      applyAnswerToTimeline(queryClient, date, data);
    },
    onError: (error, { date }) => {
      if (error?.code === 'QUESTION-004') {
        options?.onDuplicateAnswer?.({
          message: error.message,
          // 중복 답변 = 서버에 우리가 모르는 답변 존재 → 타임라인도 통째로 동기화
          syncQueries: () => {
            invalidateDateQueries(date);
            queryClient.invalidateQueries({ queryKey: questionQueryKeys.timeline });
          },
        });
      }
    },
  });
}

export function useUpdateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, answer }: { date: string; answer: string }) =>
      questionApi.updateAnswer(date, { answer }).then((res) => res.data),
    onSuccess: (data, { date }) => {
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.daily(date) });

      const calendarBaseDate = getCalendarBaseDate(date);
      queryClient.invalidateQueries({ queryKey: questionQueryKeys.calendar(calendarBaseDate) });
      // 타임라인은 응답으로 직접 패치 (refetch 없이 즉시 반영)
      applyAnswerToTimeline(queryClient, date, data);
    },
  });
}
