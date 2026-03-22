import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ReviewStatus = 'none' | 'postponed' | 'declined' | 'completed';

interface AppReviewState {
  answerCompletionCount: number;
  reviewStatus: ReviewStatus;
  answerCountAtPostpone: number; // 나중에 누른 시점의 답변 수

  incrementAnswerCount: () => void;
  setReviewStatus: (status: 'postponed' | 'declined' | 'completed') => void;
  shouldShowReviewPrompt: () => boolean;
}

const REVIEW_TRIGGER_COUNT = 5;  // 1회차: 5번 답변
const POSTPONE_ANSWER_COUNT = 5; // 2회차: 5번 더 답변

export const useAppReviewStore = create<AppReviewState>()(
  persist(
    (set, get) => ({
      answerCompletionCount: 0,
      reviewStatus: 'none',
      answerCountAtPostpone: 0,

      incrementAnswerCount: () =>
        set((state) => ({
          answerCompletionCount: state.answerCompletionCount + 1,
        })),

      setReviewStatus: (status: 'postponed' | 'declined' | 'completed') =>
        set((state) => ({
          reviewStatus: status,
          answerCountAtPostpone: status === 'postponed'
            ? state.answerCompletionCount
            : state.answerCountAtPostpone,
        })),

      shouldShowReviewPrompt: () => {
        const { answerCompletionCount, reviewStatus, answerCountAtPostpone } = get();

        // 이미 리뷰 완료 또는 거절한 경우 → 영원히 안 보여줌
        if (reviewStatus === 'completed' || reviewStatus === 'declined') {
          return false;
        }

        // 1회차: 5번 답변 달성시
        if (answerCompletionCount >= REVIEW_TRIGGER_COUNT && reviewStatus === 'none') {
          return true;
        }

        // 2회차: 나중에 누른 후 5번 더 답변
        if (reviewStatus === 'postponed') {
          return answerCompletionCount >= answerCountAtPostpone + POSTPONE_ANSWER_COUNT;
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
