import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationState {
  fcmToken: string | null;
  setFcmToken: (token: string | null) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      fcmToken: null,
      setFcmToken: (token) => set({ fcmToken: token }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (_persistedState: unknown, version: number) => {
        if (version < 2) {
          return { fcmToken: null };
        }
        return _persistedState as NotificationState;
      },
    }
  )
);
