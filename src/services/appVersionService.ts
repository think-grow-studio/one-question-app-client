import { apiClient } from './apiClient';
import { AppVersionCheckResponse, PlatformType } from '@/types/api';
import { Platform } from 'react-native';
import { config } from '@/constants/config';

export const appVersionService = {
  /**
   * 서버에서 앱 버전 요구사항 확인
   */
  async checkVersion(): Promise<AppVersionCheckResponse> {
    const platform: PlatformType = Platform.OS === 'ios' ? 'ios' : 'android';

    const response = await apiClient.get<AppVersionCheckResponse>(
      '/api/v1/app-versions',
    );

    return response.data;
  },
};
