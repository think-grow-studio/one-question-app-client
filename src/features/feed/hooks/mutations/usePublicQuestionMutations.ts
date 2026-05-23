import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiErrorResponse } from '@/shared/types/api';
import { publicQuestionApi } from '../../api/publicQuestionApi';
import type {
  PublicAnswerWriteDto,
  ToggleLikeDto,
} from '../../types/api';
import { publicQuestionQueryKeys } from '../queries/usePublicQuestionQueries';

interface SilentInfo {
  message: string;
  syncQueries: () => void;
}

export function useCreatePublicAnswer(options?: {
  /**
   * PUBLIC-QUESTION-004 (이미 답변) 발생 시 호출. 표시 책임은 호출자에게 위임.
   * @param info.syncQueries - dialog 확인 후 호출할 daily 동기화 함수.
   */
  onAlreadyAnswered?: (info: SilentInfo) => void;
}) {
  const queryClient = useQueryClient();
  const invalidateDaily = (date: string) =>
    queryClient.invalidateQueries({ queryKey: publicQuestionQueryKeys.daily(date) });

  return useMutation<
    PublicAnswerWriteDto,
    ApiErrorResponse,
    { pdqId: number; date: string; content: string }
  >({
    mutationFn: ({ pdqId, content }) =>
      publicQuestionApi.createAnswer(pdqId, content).then((r) => r.data),
    onSuccess: (_, { date }) => invalidateDaily(date),
    onError: (error, { date }) => {
      if (error?.code === 'PUBLIC-QUESTION-004') {
        options?.onAlreadyAnswered?.({
          message: error.message,
          syncQueries: () => invalidateDaily(date),
        });
      }
    },
  });
}

export function useUpdatePublicAnswer(options?: {
  /**
   * PUBLIC-QUESTION-005 (답변 없음/권한 없음) 발생 시 호출.
   * 클라가 보고 있던 답변이 stale 한 상황 — dialog 닫고 daily refetch.
   */
  onAnswerGone?: (info: SilentInfo) => void;
}) {
  const queryClient = useQueryClient();
  const invalidateDaily = (date: string) =>
    queryClient.invalidateQueries({ queryKey: publicQuestionQueryKeys.daily(date) });

  return useMutation<
    PublicAnswerWriteDto,
    ApiErrorResponse,
    { pdqId: number; answerId: number; date: string; content: string }
  >({
    mutationFn: ({ pdqId, answerId, content }) =>
      publicQuestionApi.updateAnswer(pdqId, answerId, content).then((r) => r.data),
    onSuccess: (_, { date }) => invalidateDaily(date),
    onError: (error, { date }) => {
      if (error?.code === 'PUBLIC-QUESTION-005') {
        options?.onAnswerGone?.({
          message: error.message,
          syncQueries: () => invalidateDaily(date),
        });
      }
    },
  });
}

export function useDeletePublicAnswer(options?: {
  onAnswerGone?: (info: SilentInfo) => void;
}) {
  const queryClient = useQueryClient();
  const invalidateDaily = (date: string) =>
    queryClient.invalidateQueries({ queryKey: publicQuestionQueryKeys.daily(date) });

  return useMutation<
    void,
    ApiErrorResponse,
    { pdqId: number; answerId: number; date: string }
  >({
    mutationFn: ({ pdqId, answerId }) =>
      publicQuestionApi.deleteAnswer(pdqId, answerId).then(() => undefined),
    onSuccess: (_, { date }) => invalidateDaily(date),
    onError: (error, { date }) => {
      if (error?.code === 'PUBLIC-QUESTION-005') {
        options?.onAnswerGone?.({
          message: error.message,
          syncQueries: () => invalidateDaily(date),
        });
      }
    },
  });
}

// 좋아요 토글: 응답의 새 `liked` 값을 호출부가 받아 row local state 를 갱신한다.
// 캐시 미사용 정책상 무한 query 전체 invalidate 는 UX 비효율 — 추후 캐시 도입 시 optimistic update 로 승격.
export function useTogglePublicAnswerLike() {
  return useMutation<
    ToggleLikeDto,
    ApiErrorResponse,
    { pdqId: number; answerId: number }
  >({
    mutationFn: ({ pdqId, answerId }) =>
      publicQuestionApi.toggleLike(pdqId, answerId).then((r) => r.data),
  });
}
