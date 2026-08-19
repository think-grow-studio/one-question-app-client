import { useCallback } from 'react';
import { useAppReviewStore } from '@/features/answer/stores/useAppReviewStore';
import { requestAppReview } from '@/platform/app/appReview';

/**
 * 답변 제출 흐름의 마지막에 호출. 트리거 조건(첫 5번째 답변, 1회 한정) 충족 시
 * expo-store-review의 native review API를 즉시 호출한다. 자체 pre-prompt(별도 dialog)는
 * 두지 않는다 — Apple/Google 가이드라인이 pre-prompt를 명시적으로 지양하고 system이
 * 자체 빈도 제한을 갖기 때문. system이 dialog를 띄울지 말지는 system이 결정.
 */
export function useAppReviewPrompt() {
  const incrementAnswerCount = useAppReviewStore((s) => s.incrementAnswerCount);
  const shouldShowReviewPrompt = useAppReviewStore((s) => s.shouldShowReviewPrompt);
  const markReviewRequested = useAppReviewStore((s) => s.markReviewRequested);

  const maybeRequestReview = useCallback(async () => {
    incrementAnswerCount();
    if (!shouldShowReviewPrompt()) return;
    markReviewRequested();
    await requestAppReview();
  }, [incrementAnswerCount, shouldShowReviewPrompt, markReviewRequested]);

  return { maybeRequestReview };
}
