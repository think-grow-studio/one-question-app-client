/**
 * Collection Feature Store Types
 * Client-side state for Letter Archive UI
 */

export type ViewMode = '카테고리' | '날짜';

export interface CollectionStore {
  viewMode: ViewMode;
  expandedLetterId: string | null;
  selectedCategory: string | null;
  selectedStartDate: string | null;
  selectedEndDate: string | null;
  setViewMode: (mode: ViewMode) => void;
  setExpandedLetterId: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedStartDate: (date: string | null) => void;
  setSelectedEndDate: (date: string | null) => void;
}
