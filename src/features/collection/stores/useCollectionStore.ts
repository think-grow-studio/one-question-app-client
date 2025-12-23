import { create } from 'zustand';
import { CollectionStore, ViewMode } from '../types/store';

/**
 * Collection Store
 * Manages UI state for Letter Archive feature
 */
export const useCollectionStore = create<CollectionStore>((set) => ({
  viewMode: '카테고리',
  expandedLetterId: null,
  selectedCategory: null,
  selectedStartDate: null,
  selectedEndDate: null,

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  setExpandedLetterId: (id: string | null) => set({ expandedLetterId: id }),

  toggleExpanded: (id: string) =>
    set((state) => ({
      expandedLetterId: state.expandedLetterId === id ? null : id,
    })),

  setSelectedCategory: (category: string | null) =>
    set({ selectedCategory: category }),

  setSelectedStartDate: (date: string | null) =>
    set({ selectedStartDate: date }),

  setSelectedEndDate: (date: string | null) =>
    set({ selectedEndDate: date }),
}));
