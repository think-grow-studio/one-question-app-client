import { create } from 'zustand';
import { QuestionCategory } from '@/features/question/types/category';

interface CategoryState {
  selectedCategories: Set<QuestionCategory>;
  toggleCategory: (category: QuestionCategory) => void;
  clearCategories: () => void;
  hasSelection: () => boolean;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  selectedCategories: new Set(),

  toggleCategory: (category) =>
    set((state) => {
      const newSelected = new Set(state.selectedCategories);
      if (newSelected.has(category)) {
        newSelected.delete(category);
      } else {
        newSelected.add(category);
      }
      return { selectedCategories: newSelected };
    }),

  clearCategories: () => set({ selectedCategories: new Set() }),

  hasSelection: () => get().selectedCategories.size > 0,
}));
