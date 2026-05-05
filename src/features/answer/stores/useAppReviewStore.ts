import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppReviewState {
  answerCompletionCount: number;
  hasRequestedReview: boolean;

  incrementAnswerCount: () => void;
  shouldShowReviewPrompt: () => boolean;
  markReviewRequested: () => void;
}

const REVIEW_TRIGGER_COUNT = 5; // 첫 답변 5번 달성 시 native review 호출

export const useAppReviewStore = create<AppReviewState>()(
  persist(
    (set, get) => ({
      answerCompletionCount: 0,
      hasRequestedReview: false,

      incrementAnswerCount: () =>
        set((state) => ({
          answerCompletionCount: state.answerCompletionCount + 1,
        })),

      // 한 번 요청한 뒤로는 expo-store-review의 system 빈도 제한에 위임 (iOS 1년 3회 등).
      // 우리 로직은 "처음 한 번 호출할 시점"만 결정 — 그 이후는 system 책임.
      shouldShowReviewPrompt: () => {
        const { answerCompletionCount, hasRequestedReview } = get();
        if (hasRequestedReview) return false;
        return answerCompletionCount >= REVIEW_TRIGGER_COUNT;
      },

      markReviewRequested: () => set({ hasRequestedReview: true }),
    }),
    {
      name: 'app-review-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      // v1(reviewStatus 4-state) → v2(hasRequestedReview boolean) 마이그레이션.
      // - 'completed'/'declined' → hasRequestedReview=true (이미 처리된 사용자, 재호출 X)
      // - 'postponed'/'none' → hasRequestedReview=false (재트리거 가능, system이 빈도 제한)
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          const old = persistedState as {
            answerCompletionCount?: number;
            reviewStatus?: 'none' | 'postponed' | 'declined' | 'completed';
          } | null;
          const hasRequestedReview =
            old?.reviewStatus === 'completed' || old?.reviewStatus === 'declined';
          return {
            answerCompletionCount: old?.answerCompletionCount ?? 0,
            hasRequestedReview,
          };
        }
        return persistedState as AppReviewState;
      },
    }
  )
);
