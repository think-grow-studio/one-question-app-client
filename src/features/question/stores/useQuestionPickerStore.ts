import { create } from 'zustand';

interface QuestionPickerState {
  selectedQuestion: string | null;
  isOpened: boolean;
  setSelectedQuestion: (question: string) => void;
  setIsOpened: (opened: boolean) => void;
  reset: () => void;
}

export const useQuestionPickerStore = create<QuestionPickerState>((set) => ({
  selectedQuestion: null,
  isOpened: false,
  setSelectedQuestion: (question) => set({ selectedQuestion: question }),
  setIsOpened: (opened) => set({ isOpened: opened }),
  reset: () => set({ selectedQuestion: null, isOpened: false }),
}));
