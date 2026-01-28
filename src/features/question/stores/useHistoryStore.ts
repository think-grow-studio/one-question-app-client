import { create } from 'zustand';

interface QuestionHistoryItem {
  date: string; // YYYY-MM-DD
  question: string;
  description?: string;
  answer?: string;
  reloadCount?: number; // 질문 reload 가능 횟수 (기본값: 2)
}

interface HistoryStore {
  currentDate: string;
  history: QuestionHistoryItem[];
  isDatePickerVisible: boolean;
  setCurrentDate: (date: string) => void;
  setIsDatePickerVisible: (visible: boolean) => void;
  getQuestionByDate: (date: string) => QuestionHistoryItem | null;
  getReloadCount: (date: string) => number;
  addQuestion: (date: string, question: string, description?: string) => void;
  addAnswer: (date: string, answer: string) => void;
  decrementReloadCount: (date: string) => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  currentDate: new Date().toISOString().split('T')[0], // 'YYYY-MM-DD' 형식
  history: [],
  isDatePickerVisible: false,
  setCurrentDate: (date) => {
    console.log('[useHistoryStore] setCurrentDate called:', date, new Error().stack);
    set({ currentDate: date });
  },
  setIsDatePickerVisible: (visible) => set({ isDatePickerVisible: visible }),
  getQuestionByDate: (date) => {
    const { history } = get();
    return history.find((item) => item.date === date) || null;
  },
  getReloadCount: (date) => {
    const { history } = get();
    const item = history.find((item) => item.date === date);
    return item?.reloadCount ?? 2; // 기본값 2
  },
  addQuestion: (date, question, description) =>
    set((state) => {
      const existingItem = state.history.find((item) => item.date === date);
      if (existingItem) {
        // 기존 항목 업데이트 (질문 교체)
        return {
          history: state.history.map((item) =>
            item.date === date ? { ...item, question, description } : item
          ),
        };
      }
      // 새 항목 추가 (reloadCount 초기값 2)
      return {
        history: [...state.history, { date, question, description, reloadCount: 2 }],
      };
    }),
  addAnswer: (date, answer) =>
    set((state) => ({
      history: state.history.map((item) =>
        item.date === date ? { ...item, answer } : item
      ),
    })),
  decrementReloadCount: (date) =>
    set((state) => ({
      history: state.history.map((item) =>
        item.date === date && (item.reloadCount ?? 2) > 0
          ? { ...item, reloadCount: (item.reloadCount ?? 2) - 1 }
          : item
      ),
    })),
}));
