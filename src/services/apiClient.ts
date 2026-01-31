import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as Localization from 'expo-localization';
import { config } from '@/constants/config';
import { storage } from './storage';
import i18n from '@/locales';
import { useApiErrorStore } from '@/stores/useApiErrorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { ApiErrorResponse, AuthResponse } from '@/types/api';
import { tokenRefreshService } from './tokenRefreshService';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 5000, // 5초 (총 대기 시간 단축: 47초 → 27초)
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
        // 🔒 Mutex: 여러 요청이 동시에 401을 받아도 갱신은 1번만 실행
        const accessToken = await tokenRefreshService.refresh();

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // NOTE: 사용자 선택으로 조용히 로그아웃 유지
        // 향후 개선: showWarning으로 사용자에게 알림 후 로그아웃
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // 서버에서 전달한 에러 메시지 사용 (fallback: i18n 메시지)
    const errorMessage =
      error.response?.data?.message || // 서버 메시지 우선
      (error.code === 'ECONNABORTED' ? i18n.t('common:error.timeout') : null) ||
      (error.code === 'ERR_NETWORK' ? i18n.t('common:error.network') : null) ||
      (error.response?.status && error.response.status >= 500
        ? i18n.t('common:error.server')
        : i18n.t('common:error.unknown'));

    // 401 에러는 팝업 표시하지 않음 (로그인 필요 상태에서 불필요한 팝업 방지)
    // 다른 에러(400, 500 등)는 기존대로 팝업 표시
    if (error.response?.status !== 401) {
      useApiErrorStore.getState().showError(
        errorMessage,
        error.response?.data?.traceId // 🆕 traceId 전달
      );
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
