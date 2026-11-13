import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { publicQuestionApi } from '../../api/publicQuestionApi';
import {
  fromPublicAnswerDto,
  type PublicAnswerCursor,
  type PublicAnswerDomain,
  type PublicAnswerListDto,
  type PublicDailyQuestionDto,
} from '../../types/api';

export const publicQuestionQueryKeys = {
  all: ['publicQuestion'] as const,
  daily: (date: string) => [...publicQuestionQueryKeys.all, 'daily', date] as const,
};

// 캐시 미사용 정책 — 추후 캐시 도입 시 이 객체만 수정하면 모든 PDQ 쿼리에 적용됨.
const NO_CACHE = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always' as const,
};

// daily 무한 쿼리의 페이지 — items 가 domain 으로 매핑된 형태.
// 첫 페이지(getDaily)만 question(질문 + 내 답변)을 담고, 이후 페이지(listAnswers)는 답변 목록만.
export type PublicDailyQuestionInfo = Omit<PublicDailyQuestionDto, 'answers'>;
export type PublicDailyPage = Omit<PublicAnswerListDto, 'items'> & {
  question?: PublicDailyQuestionInfo;
  items: PublicAnswerDomain[];
};
// 다음 페이지 조회엔 pdqId 가 필요한데 queryFn 은 이전 페이지를 못 보므로 커서와 함께 싣는다.
type PublicDailyPageParam = { pdqId: number; cursor: PublicAnswerCursor } | undefined;
export type PublicDailyInfiniteData = InfiniteData<PublicDailyPage, PublicDailyPageParam>;

const toPage = (list: PublicAnswerListDto): PublicDailyPage => ({
  ...list,
  items: list.items.map(fromPublicAnswerDto),
});

// 질문 + 다른 멤버 답변을 하나의 무한 쿼리로 조회.
// 서버가 daily 응답에 답변 첫 페이지를 포함하므로 첫 진입은 요청 1회, 이후 스크롤만 listAnswers.
export function useDailyPublicQuestion(date: string) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: publicQuestionQueryKeys.daily(date),
    queryFn: async ({ pageParam }): Promise<PublicDailyPage> => {
      if (!pageParam) {
        const { answers, ...question } = (await publicQuestionApi.getDaily(date)).data;
        return { ...toPage(answers), question };
      }
      const res = await publicQuestionApi.listAnswers(pageParam.pdqId, {
        cursorAnsweredAt: pageParam.cursor.answeredAt,
        cursorId: pageParam.cursor.id,
        size: 10,
      });
      return toPage(res.data);
    },
    initialPageParam: undefined as PublicDailyPageParam,
    getNextPageParam: (last, pages): PublicDailyPageParam => {
      const pdqId = pages[0]?.question?.publicDailyQuestionId;
      if (!last.hasNext || !last.nextCursor || pdqId === undefined) return undefined;
      return { pdqId, cursor: last.nextCursor };
    },
    ...NO_CACHE,
    // 그 날짜에 PDQ 없음(404) → 화면이 빈 상태로 분기, 글로벌 dialog 불필요.
    meta: { suppressGlobalErrorCodes: ['PUBLIC-QUESTION-003'] },
  });

  const pages = query.data?.pages;
  const pdq = pages?.[0]?.question;
  // 무한 페이지 → flat list. 본인 답변은 서버가 이미 목록에서 제외.
  const answers = useMemo(() => pages?.flatMap((p) => p.items) ?? [], [pages]);

  // pull-to-refresh 용 — 누적 페이지를 첫 페이지만 남기고 잘라낸 뒤 refetch → 요청 1회.
  // 1000 개 답변 스크롤 후 refetch 하면 전체 페이지 일괄 다운로드되는 비용을 회피.
  // resetQueries 는 데이터를 비워 질문 헤더까지 로딩 상태로 바뀌므로 쓰지 않는다.
  // 컴포넌트가 query key 를 모르도록 closure 로 캡슐화 (§15.2).
  const resetPagination = useCallback(() => {
    const queryKey = publicQuestionQueryKeys.daily(date);
    queryClient.setQueryData<PublicDailyInfiniteData>(queryKey, (old) =>
      old ? { pages: old.pages.slice(0, 1), pageParams: old.pageParams.slice(0, 1) } : old,
    );
    void queryClient.refetchQueries({ queryKey, exact: true });
  }, [date, queryClient]);

  return Object.assign(query, { pdq, answers, resetPagination });
}
