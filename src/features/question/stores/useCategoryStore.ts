import { create } from 'zustand';
import { Category } from '@/constants/categories';

interface CategoryState {
  selectedCategories: Set<string>;
  toggleCategory: (category: Category) => void;
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
