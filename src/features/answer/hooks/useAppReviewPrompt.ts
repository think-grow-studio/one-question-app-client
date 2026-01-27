import { useState, useCallback } from 'react';
import { useAppReviewStore } from '@/stores/useAppReviewStore';
import { requestAppReview } from '@/services/appReview';

export function useAppReviewPrompt() {
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const [isButtonsDisabled, setIsButtonsDisabled] = useState(false);
  const { incrementAnswerCount, shouldShowReviewPrompt, setReviewStatus } =
    useAppReviewStore();

  const onAnswerSubmitted = useCallback(() => {
    incrementAnswerCount();

    if (shouldShowReviewPrompt()) {
      setTimeout(() => {
        setShowPrePrompt(true);
        setIsButtonsDisabled(true);
        setTimeout(() => setIsButtonsDisabled(false), 500);
      }, 500);
    }
  }, [incrementAnswerCount, shouldShowReviewPrompt]);

  const handleLater = useCallback(() => {
    if (isButtonsDisabled) return;
    setReviewStatus('postponed');
    setShowPrePrompt(false);
  }, [setReviewStatus, isButtonsDisabled]);

  const handleDecline = useCallback(() => {
    if (isButtonsDisabled) return;
    setReviewStatus('declined');
    setShowPrePrompt(false);
  }, [setReviewStatus, isButtonsDisabled]);

  const handleAccept = useCallback(async () => {
    if (isButtonsDisabled) return;
    setShowPrePrompt(false);
    const success = await requestAppReview();
    if (success) {
      setReviewStatus('completed');
    }
  }, [setReviewStatus, isButtonsDisabled]);

  const closePrePrompt = useCallback(() => {
    if (isButtonsDisabled) return;
    setShowPrePrompt(false);
  }, [isButtonsDisabled]);

  return {
    showPrePrompt,
    isButtonsDisabled,
    onAnswerSubmitted,
    handleLater,
    handleDecline,
    handleAccept,
    closePrePrompt,
  };
}
