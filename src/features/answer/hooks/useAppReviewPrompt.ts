import { useState, useCallback } from 'react';
import { useAppReviewStore } from '@/stores/useAppReviewStore';
import { requestAppReview } from '@/services/appReview';

export function useAppReviewPrompt() {
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const { incrementAnswerCount, shouldShowReviewPrompt, setReviewStatus } =
    useAppReviewStore();

  // 답변 제출 후 호출 - 리뷰 필요 여부 반환 (상태 변경 없음)
  const prepareReview = useCallback((): boolean => {
    incrementAnswerCount();
    return shouldShowReviewPrompt();
  }, [incrementAnswerCount, shouldShowReviewPrompt]);

  // 성공 팝업 닫힌 후 리뷰 팝업 표시
  const showReviewPrompt = useCallback(() => {
    setShowPrePrompt(true);
  }, []);

  const handleLater = useCallback(() => {
    const currentStatus = useAppReviewStore.getState().reviewStatus;
    if (currentStatus === 'postponed') {
      // 두 번째 나중에 → 영원히 안 보여줌
      setReviewStatus('declined');
    } else {
      // 첫 번째 나중에 → 5번 더 답변 후 재요청
      setReviewStatus('postponed');
    }
    setShowPrePrompt(false);
  }, [setReviewStatus]);

  const handleAccept = useCallback(async () => {
    setShowPrePrompt(false);
    const success = await requestAppReview();
    if (success) {
      setReviewStatus('completed');
    } else {
      setReviewStatus('postponed');
    }
  }, [setReviewStatus]);

  return {
    showPrePrompt,
    prepareReview,
    showReviewPrompt,
    handleLater,
    handleAccept,
  };
}
