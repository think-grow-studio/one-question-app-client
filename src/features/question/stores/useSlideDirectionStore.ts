import { create } from 'zustand';
import type { HistoryDirection } from '@/types/api';

interface SlideDirectionStore {
  direction: HistoryDirection;
  setDirectionForNextDay: () => void;
  setDirectionForPreviousDay: () => void;
  setDirectionForCalendar: () => void;
}

export const useSlideDirectionStore = create<SlideDirectionStore>((set) => ({
  direction: 'PREVIOUS', // 앱 진입 시 기본값

  setDirectionForNextDay: () => {
    set({ direction: 'NEXT' }); // 미래로 갔으니 더 미래 데이터 캐싱
  },

  setDirectionForPreviousDay: () => {
    set({ direction: 'PREVIOUS' }); // 과거로 갔으니 더 과거 데이터 캐싱
  },

  setDirectionForCalendar: () => {
    set({ direction: 'BOTH' });
  },
}));
