import { create } from 'zustand';

interface ApiErrorState {
  isVisible: boolean;
  message: string | null;
  requestId: string | null; // 🆕 requestId 추가
  showError: (message: string, requestId?: string) => void;
  hideError: () => void;
}

export const useApiErrorStore = create<ApiErrorState>((set) => ({
  isVisible: false,
  message: null,
  requestId: null,

  showError: (message: string, requestId?: string) =>
    set({ isVisible: true, message, requestId: requestId || null }),

  hideError: () =>
    set({ isVisible: false, message: null, requestId: null }),
}));
