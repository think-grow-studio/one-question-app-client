import { apiClient } from '@/platform/http/apiClient';
import type { NotificationSetting } from '@/features/member/public';

interface UpsertSettingRequest {
  alarmTime: string;
  timezone: string;
  enabled: boolean;
  // 서버가 아직 이 필드를 모르면 무시됨 (forward-compatible)
  analysisReportEnabled: boolean;
}

export const notificationApi = {
  registerFcmToken: (tokenValue: string) =>
    apiClient.post<void>('/api/v1/members/me/notifications/fcm-token', { tokenValue }),

  deleteFcmToken: (tokenValue: string) =>
    apiClient.delete<void>('/api/v1/members/me/notifications/fcm-token', {
      data: { tokenValue },
    }),

  upsertSetting: (data: UpsertSettingRequest) =>
    apiClient.put<NotificationSetting>('/api/v1/members/me/notifications/settings', data),

  getSetting: () =>
    apiClient.get<NotificationSetting>('/api/v1/members/me/notifications/settings'),
};
