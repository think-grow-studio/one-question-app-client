import { useState, useCallback } from 'react';
import { useAppReviewStore } from '@/stores/useAppReviewStore';
import { requestAppReview } from '@/services/appReview';

export function useAppReviewPrompt() {
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const { incrementAnswerCount, shouldShowReviewPrompt, setReviewStatus } =
    useAppReviewStore();

  const onAnswerSubmitted = useCallback(() => {
    incrementAnswerCount();

    if (shouldShowReviewPrompt()) {
      setTimeout(() => setShowPrePrompt(true), 500);
    }
  }, [incrementAnswerCount, shouldShowReviewPrompt]);

  const handleLater = useCallback(() => {
    setReviewStatus('postponed');
    setShowPrePrompt(false);
  }, [setReviewStatus]);

  const handleDecline = useCallback(() => {
    setReviewStatus('declined');
    setShowPrePrompt(false);
  }, [setReviewStatus]);

  const handleAccept = useCallback(async () => {
    setShowPrePrompt(false);
    const success = await requestAppReview();
    if (success) {
      setReviewStatus('completed');
    }
  }, [setReviewStatus]);

  const closePrePrompt = useCallback(() => {
    setShowPrePrompt(false);
  }, []);

  return {
    showPrePrompt,
    onAnswerSubmitted,
    handleLater,
    handleDecline,
    handleAccept,
    closePrePrompt,
  };
}
