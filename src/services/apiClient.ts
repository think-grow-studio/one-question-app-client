import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as Localization from 'expo-localization';
import { config } from '@/constants/config';
import { storage } from './storage';
import i18n from '@/locales';
import { useApiErrorStore } from '@/stores/useApiErrorStore';
import { ApiErrorResponse, AuthResponse } from '@/types/api';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - 토큰, Locale, Timezone 주입
apiClient.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    // 토큰 주입
    const token = await storage.getAccessToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    // Locale 주입 (ko-KR 형식 사용)
    requestConfig.headers['Accept-Language'] =
      Localization.getLocales()[0]?.languageTag ?? i18n.language;

    // Timezone 주입
    requestConfig.headers['Timezone'] =
      Localization.getCalendars()[0]?.timeZone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - 에러 처리 + 토큰 자동 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 처리 (토큰 만료) - reissue-token 요청은 제외
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/reissue-token')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (refreshToken) {
          // apiClient 대신 axios 직접 사용 (인터셉터 무한 루프 방지)
          const response = await axios.post<AuthResponse>(
            `${config.apiUrl}/api/v1/auth/reissue-token`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await storage.setAccessToken(accessToken);
          await storage.setRefreshToken(newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        // 리프레시 실패 -> 토큰 삭제
        await storage.clearTokens();
      }
    }

    // 서버에서 전달한 에러 메시지 사용 (fallback: 기본 메시지)
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      '알 수 없는 오류가 발생했습니다.';

    // 401 에러는 팝업 표시하지 않음 (로그인 필요 상태에서 불필요한 팝업 방지)
    // 다른 에러(400, 500 등)는 기존대로 팝업 표시
    if (error.response?.status !== 401) {
      useApiErrorStore.getState().showError(errorMessage);
    }

    // 에러 정규화 후 reject
    const normalizedError: ApiErrorResponse = {
      traceId: error.response?.data?.traceId || '',
      status: error.response?.status || 0,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message: errorMessage,
    };

    return Promise.reject(normalizedError);
  }
);
