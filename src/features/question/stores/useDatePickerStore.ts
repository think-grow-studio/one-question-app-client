import { create } from 'zustand';

/**
 * DatePicker UI 상태만 관리하는 스토어
 * 서버 상태(질문, 히스토리 등)는 TanStack Query로 관리
 */
interface DatePickerStore {
  currentDate: string;
  isDatePickerVisible: boolean;
  setCurrentDate: (date: string) => void;
  setIsDatePickerVisible: (visible: boolean) => void;
}

export const useDatePickerStore = create<DatePickerStore>((set) => ({
  currentDate: new Date().toISOString().split('T')[0], // 'YYYY-MM-DD' 형식
  isDatePickerVisible: false,
  setCurrentDate: (date) => {
    set({ currentDate: date });
  },
  setIsDatePickerVisible: (visible) => set({ isDatePickerVisible: visible }),
}));
