import { create } from 'zustand';

interface ApiErrorState {
  isVisible: boolean;
  message: string | null;
  traceId: string | null; // 🆕 traceId 추가
  showError: (message: string, traceId?: string) => void;
  hideError: () => void;
}

export const useApiErrorStore = create<ApiErrorState>((set) => ({
  isVisible: false,
  message: null,
  traceId: null,

  showError: (message: string, traceId?: string) =>
    set({ isVisible: true, message, traceId: traceId || null }),

  hideError: () =>
    set({ isVisible: false, message: null, traceId: null }),
}));
