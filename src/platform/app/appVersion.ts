import { apiClient } from '@/platform/http/apiClient';

export interface AppVersionCheckResponse {
  latestVersion: string;
  minVersion: string;
  serverLive: boolean;
}

export const appVersionService = {
  /**
   * 서버에서 앱 버전 요구사항 확인
   */
  async checkVersion(): Promise<AppVersionCheckResponse> {
    const response = await apiClient.get<AppVersionCheckResponse>(
      '/api/v1/app-versions',
    );

    return response.data;
  },
};
