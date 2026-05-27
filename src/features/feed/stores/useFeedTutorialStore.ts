import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeedTutorialState {
  hasSeenFeedTutorial: boolean;

  markAsSeen: () => void;
  reset: () => void;
}

export const useFeedTutorialStore = create<FeedTutorialState>()(
  persist(
    (set) => ({
      hasSeenFeedTutorial: false,

      markAsSeen: () => set({ hasSeenFeedTutorial: true }),
      reset: () => set({ hasSeenFeedTutorial: false }),
    }),
    {
      name: 'feed-tutorial-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
