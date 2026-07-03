import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type HomeView = 'card' | 'timeline';

interface HomeViewState {
  /** 홈 화면 본문 뷰. 'card'(하루 한 장) | 'timeline'(기록 타임라인) */
  view: HomeView;
  setView: (view: HomeView) => void;
}

/**
 * 홈 화면 카드/타임라인 뷰 선택 상태.
 * 사용자가 마지막으로 본 뷰를 AsyncStorage에 영구 저장 → 앱 재실행 시 복원.
 * (단일 consumer = QuestionHistoryView → feature-local store, README §5 store 위치 규칙)
 */
export const useHomeViewStore = create<HomeViewState>()(
  persist(
    (set) => ({
      view: 'card',
      setView: (view) => set({ view }),
    }),
    {
      name: 'home-view-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
