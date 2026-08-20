import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { ApiErrorResponse } from '@/platform/http/types';
import { publicQuestionApi } from '../../api/publicQuestionApi';
import type {
  PublicAnswerDomain,
  PublicAnswerListDto,
  PublicAnswerWriteDto,
  PublicDailyQuestionDto,
  ToggleLikeDto,
} from '../../types/api';
import { publicQuestionQueryKeys } from '../queries/usePublicQuestionQueries';

// 무한 쿼리에 저장되는 페이지 타입 — items 가 domain 으로 매핑된 형태.
type AnswersPage = Omit<PublicAnswerListDto, 'items'> & { items: PublicAnswerDomain[] };
type AnswersInfiniteData = InfiniteData<AnswersPage>;

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
    // 이미 답변은 onAlreadyAnswered가 로컬 dialog로 처리 — 글로벌 dialog 생략.
    meta: { suppressGlobalErrorCodes: ['PUBLIC-QUESTION-004'] },
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
    // stale 답변(이미 없음/권한 없음)은 onAnswerGone이 로컬 dialog로 처리 — 글로벌 dialog 생략.
    meta: { suppressGlobalErrorCodes: ['PUBLIC-QUESTION-005'] },
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
    { pdqId: number; answerId: number; date: string },
    { snapshot: PublicDailyQuestionDto | undefined }
  >({
    mutationFn: ({ pdqId, answerId }) =>
      publicQuestionApi.deleteAnswer(pdqId, answerId).then(() => undefined),
    // stale 답변(이미 없음/권한 없음)은 onAnswerGone이 로컬 dialog로 처리 — 글로벌 dialog 생략.
    meta: { suppressGlobalErrorCodes: ['PUBLIC-QUESTION-005'] },
    // 삭제 확인 즉시 myAnswer 를 null 로 낙관적 업데이트 → FAB 즉시 표시.
    onMutate: async ({ date }) => {
      await queryClient.cancelQueries({ queryKey: publicQuestionQueryKeys.daily(date) });
      const snapshot = queryClient.getQueryData<PublicDailyQuestionDto>(
        publicQuestionQueryKeys.daily(date),
      );
      queryClient.setQueryData<PublicDailyQuestionDto>(
        publicQuestionQueryKeys.daily(date),
        (old) => (old ? { ...old, myAnswer: null } : old),
      );
      return { snapshot };
    },
    onSuccess: (_, { date }) => invalidateDaily(date),
    onError: (error, { date }, context) => {
      // 실패 시 롤백
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(publicQuestionQueryKeys.daily(date), context.snapshot);
      }
      if (error?.code === 'PUBLIC-QUESTION-005') {
        options?.onAnswerGone?.({
          message: error.message,
          syncQueries: () => invalidateDaily(date),
        });
      }
    },
  });
}

// 좋아요 토글: TanStack Query 캐시를 단일 source of truth 로 유지.
// onMutate 에서 무한 쿼리의 해당 answer 항목을 직접 낙관적 업데이트 → AnswerCard 는 prop 만 렌더.
// 서버 refetch 시 자동으로 다른 사용자 토글까지 반영됨 (다중 디바이스 동기화).
export function useTogglePublicAnswerLike() {
  const queryClient = useQueryClient();

  const updateAnswerInCache = (
    pdqId: number,
    answerId: number,
    updater: (a: PublicAnswerDomain) => PublicAnswerDomain,
  ) => {
    queryClient.setQueryData<AnswersInfiniteData>(
      publicQuestionQueryKeys.answers(pdqId),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((it) =>
              it.publicDailyQuestionAnswerId === answerId ? updater(it) : it,
            ),
          })),
        };
      },
    );
  };

  return useMutation<
    ToggleLikeDto,
    ApiErrorResponse,
    { pdqId: number; answerId: number },
    { snapshot: AnswersInfiniteData | undefined }
  >({
    mutationFn: ({ pdqId, answerId }) =>
      publicQuestionApi.toggleLike(pdqId, answerId).then((r) => r.data),
    onMutate: async ({ pdqId, answerId }) => {
      await queryClient.cancelQueries({ queryKey: publicQuestionQueryKeys.answers(pdqId) });
      const snapshot = queryClient.getQueryData<AnswersInfiniteData>(
        publicQuestionQueryKeys.answers(pdqId),
      );
      updateAnswerInCache(pdqId, answerId, (a) => ({
        ...a,
        liked: !a.liked,
        likeCount: a.likeCount + (a.liked ? -1 : 1),
      }));
      return { snapshot };
    },
    onError: (_err, { pdqId }, context) => {
      // 롤백
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(publicQuestionQueryKeys.answers(pdqId), context.snapshot);
      }
    },
    onSuccess: (data, { pdqId, answerId }) => {
      // 서버 응답 liked 와 낙관 결과가 다르면 보정 (드물지만 race 대비).
      updateAnswerInCache(pdqId, answerId, (a) => {
        if (a.liked === data.liked) return a;
        return {
          ...a,
          liked: data.liked,
          likeCount: a.likeCount + (data.liked ? 1 : -1),
        };
      });
    },
  });
}
