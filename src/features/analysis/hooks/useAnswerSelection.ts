import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTimeline } from '@/features/question/hooks/queries/useQuestionQueries';
import { MIN_ANSWERS, MAX_ANSWERS } from '../constants/analysisTypes';

export interface SelectableAnswer {
  date: string; // YYYY-MM-DD
  dailyAnswerId: number;
  question: string;
  answer: string;
}

export interface AnswerSelection {
  /** 선택 가능한 답변 목록 (최신순) */
  items: SelectableAnswer[];
  /** 선택된 dailyAnswerId 집합 */
  selectedIds: Set<number>;
  /** 선택 개수 */
  count: number;
  /** 항목 선택/해제 */
  toggle: (dailyAnswerId: number) => void;
  /** 최대 개수 초과 선택 시도 직후 true */
  capHint: boolean;
  /** 선택 개수가 유효 범위(min~max) 안인지 */
  isCountValid: boolean;
  min: number;
  max: number;
  /** 첫 페이지 로딩 중인지 (초기 스피너용) */
  isLoading: boolean;
  /** 무한 스크롤: 다음 페이지 로드 (가능할 때만 동작) */
  loadMore: () => void;
  /** 더 불러올 페이지가 있는지 */
  hasMore: boolean;
  /** 다음 페이지 로딩 중인지 (푸터 스피너용) */
  isLoadingMore: boolean;
}

/**
 * 분석할 답변 선택 도메인 로직.
 * - 타임라인(ANSWERED)에서 답변만 추려 최신순 노출
 * - 충분한 양(최대 {@link MAX_ANSWERS})을 모을 때까지 다음 페이지 자동 로드
 * - 최초 1회 최근 N개 자동 선택, 이후 토글로 가감 (최대 개수 cap)
 *
 * 라우팅 레이어(app/)에 비즈니스 로직을 두지 않기 위해 분리 (PROJECT_ARCHITECTURE §4).
 */
export function useAnswerSelection(): AnswerSelection {
  const { data: days = [], hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } = useTimeline();

  const items = useMemo<SelectableAnswer[]>(
    () =>
      days
        .filter((d) => d.status === 'ANSWERED' && d.answer != null)
        .map((d) => ({
          date: d.date,
          dailyAnswerId: d.answer!.dailyAnswerId,
          question: d.question?.content ?? '',
          answer: d.answer!.content,
        })),
    [days],
  );

  // 충분한 답변을 모을 때까지 다음 페이지 로드
  useEffect(() => {
    if (items.length < MAX_ANSWERS && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 최초 진입 시 최근 N개 자동 선택 (충분히 모였거나 더 없을 때 1회 확정)
  const [selectedIds, setSelectedIds] = useState<Set<number> | null>(null);
  useEffect(() => {
    if (selectedIds != null || items.length === 0) return;
    if (items.length < MAX_ANSWERS && hasNextPage) return;
    setSelectedIds(new Set(items.slice(0, MAX_ANSWERS).map((it) => it.dailyAnswerId)));
  }, [items, hasNextPage, selectedIds]);

  const [capHint, setCapHint] = useState(false);

  const toggle = useCallback((dailyAnswerId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(dailyAnswerId)) {
        next.delete(dailyAnswerId);
        setCapHint(false);
      } else if (next.size >= MAX_ANSWERS) {
        setCapHint(true);
        return next;
      } else {
        next.add(dailyAnswerId);
      }
      return next;
    });
  }, []);

  const resolved = selectedIds ?? new Set<number>();
  const count = resolved.size;

  // 무한 스크롤: 화면에서 onEndReached 로 호출 (중복/불필요 호출 방지)
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    items,
    selectedIds: resolved,
    count,
    toggle,
    capHint,
    isCountValid: count >= MIN_ANSWERS && count <= MAX_ANSWERS,
    min: MIN_ANSWERS,
    max: MAX_ANSWERS,
    isLoading,
    loadMore,
    hasMore: !!hasNextPage,
    isLoadingMore: !!isFetchingNextPage,
  };
}
