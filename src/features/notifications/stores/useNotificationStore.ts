import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationState {
  fcmToken: string | null;
  setFcmToken: (token: string | null) => void;
  // AI 분석 리포트 알림 on/off의 로컬 진실원.
  // 서버가 NotificationSetting.analysisReportEnabled를 지원하기 전까지의 fallback이며,
  // 서버 응답에 필드가 있으면 서버 값이 우선한다. (선택 훅: useAnalysisReportEnabled)
  analysisReportEnabled: boolean;
  setAnalysisReportEnabled: (enabled: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      fcmToken: null,
      setFcmToken: (token) => set({ fcmToken: token }),
      analysisReportEnabled: true,
      setAnalysisReportEnabled: (enabled) => set({ analysisReportEnabled: enabled }),
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
