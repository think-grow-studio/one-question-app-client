import { create } from 'zustand';

interface ApiErrorState {
  isVisible: boolean;
  message: string | null;
  showError: (message: string) => void;
  hideError: () => void;
}

export const useApiErrorStore = create<ApiErrorState>((set) => ({
  isVisible: false,
  message: null,

  showError: (message: string) =>
    set({ isVisible: true, message }),

  hideError: () =>
    set({ isVisible: false, message: null }),
}));
