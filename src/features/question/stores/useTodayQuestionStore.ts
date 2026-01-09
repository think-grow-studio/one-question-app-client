import { create } from 'zustand';

type QuestionType = 'random' | 'yearAgo';

interface TodayQuestionStore {
  questionType: QuestionType;
  selectedQuestion: string | null;
  isQuestionVisible: boolean;
  setQuestionType: (type: QuestionType) => void;
  setSelectedQuestion: (question: string) => void;
  setIsQuestionVisible: (visible: boolean) => void;
  reset: () => void;
}

export const useTodayQuestionStore = create<TodayQuestionStore>((set) => ({
  questionType: 'random',
  selectedQuestion: null,
  isQuestionVisible: false,
  setQuestionType: (type) => set({ questionType: type }),
  setSelectedQuestion: (question) => set({ selectedQuestion: question }),
  setIsQuestionVisible: (visible) => set({ isQuestionVisible: visible }),
  reset: () =>
    set({
      questionType: 'random',
      selectedQuestion: null,
      isQuestionVisible: false,
    }),
}));
