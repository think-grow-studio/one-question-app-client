import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationState {
  isEnabled: boolean;
  hour: number;
  minute: number;
  setEnabled: (enabled: boolean) => void;
  setTime: (hour: number, minute: number) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      isEnabled: false,
      hour: 21, // 기본 오후 9시
      minute: 0,
      setEnabled: (enabled) => set({ isEnabled: enabled }),
      setTime: (hour, minute) => set({ hour, minute }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
