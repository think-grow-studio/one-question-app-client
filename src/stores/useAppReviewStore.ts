import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ReviewStatus = 'none' | 'postponed' | 'declined' | 'completed';

interface AppReviewState {
  answerCompletionCount: number;
  reviewStatus: ReviewStatus;
  lastPromptDate: string | null;

  incrementAnswerCount: () => void;
  setReviewStatus: (status: 'postponed' | 'declined' | 'completed') => void;
  shouldShowReviewPrompt: () => boolean;
}

const REVIEW_TRIGGER_COUNT = 3;
const POSTPONE_DAYS = 30;

export const useAppReviewStore = create<AppReviewState>()(
  persist(
    (set, get) => ({
      answerCompletionCount: 0,
      reviewStatus: 'none',
      lastPromptDate: null,

      incrementAnswerCount: () =>
        set((state) => ({
          answerCompletionCount: state.answerCompletionCount + 1,
        })),

      setReviewStatus: (status: 'postponed' | 'declined' | 'completed') =>
        set({
          reviewStatus: status,
          lastPromptDate: new Date().toISOString(),
        }),

      shouldShowReviewPrompt: () => {
        const { answerCompletionCount, reviewStatus, lastPromptDate } = get();

        // 이미 리뷰 완료 또는 거절한 경우 → 영원히 안 보여줌
        if (reviewStatus === 'completed' || reviewStatus === 'declined') {
          return false;
        }

        // 첫 요청: 3회 달성시
        if (answerCompletionCount >= REVIEW_TRIGGER_COUNT && reviewStatus === 'none') {
          return true;
        }

        // 나중에 선택한 경우: 30일 후 재요청
        if (reviewStatus === 'postponed' && lastPromptDate) {
          const daysSince = Math.floor(
            (Date.now() - new Date(lastPromptDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSince >= POSTPONE_DAYS;
        }

        return false;
      },
    }),
    {
      name: 'app-review-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
