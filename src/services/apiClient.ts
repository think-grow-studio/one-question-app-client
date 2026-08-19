import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as Localization from 'expo-localization';
import { config } from '@/constants/config';
import { LANGUAGE_LOCALE_MAP } from '@/locales/localeMap';
import { storage } from './storage';
import i18n from '@/locales';
import { ApiErrorResponse } from '@/shared/types/api';
import { tokenRefreshService } from './tokenRefreshService';
import { recordError } from '@/services/firebase';

interface HttpRuntimeConfig {
  /** refresh 실패(401 최종 처리) 시 실행 — apiClient는 auth store를 직접 모른다. */
  onUnauthorized: () => Promise<void>;
}

let httpRuntime: HttpRuntimeConfig | undefined;

/** app bootstrap에서 1회 호출해 apiClient가 필요로 하는 앱 레벨 콜백을 주입한다. */
export function configureHttpRuntime(runtimeConfig: HttpRuntimeConfig): void {
  httpRuntime = runtimeConfig;
}

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

    // Locale 주입 - 사용자 선택 언어 우선, 없으면 기기 언어 (ko-KR 형식)
    requestConfig.headers['Accept-Language'] =
      LANGUAGE_LOCALE_MAP[i18n.language as keyof typeof LANGUAGE_LOCALE_MAP] ??
      Localization.getLocales()[0]?.languageTag ??
      i18n.language;

    // Timezone 주입
    requestConfig.headers['Timezone'] =
      Localization.getCalendars()[0]?.timeZone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 개발 모드에서 API 요청 로그
    if (config.isDev) {
      console.log('[API Request]', {
        appVersion: config.appVersion,
        method: requestConfig.method?.toUpperCase(),
        url: requestConfig.url,
        baseURL: requestConfig.baseURL,
        params: requestConfig.params,
        data: requestConfig.data,
      });
    }

    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - 에러 처리 + 토큰 자동 갱신
apiClient.interceptors.response.use(
  (response) => {
    // 개발 모드에서 API 응답 로그
    if (config.isDev) {
      console.log('[API Response]', {
        appVersion: config.appVersion,
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
    }
    return response;
  },
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
        await httpRuntime?.onUnauthorized();
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

    // 표시는 queryClient의 QueryCache/MutationCache.onError가 담당
    // 에러 정규화 후 reject
    const normalizedError: ApiErrorResponse = {
      requestId: error.response?.data?.requestId || '',
      status: error.response?.status || 0,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message: errorMessage,
    };

    // Production: 5xx, 네트워크 에러만 Crashlytics로 전송
    if (!__DEV__) {
      const status = error.response?.status;
      if (!status || status >= 500) {
        recordError(
          new Error(`[${status ?? 'NETWORK'}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`),
          `API:${error.config?.url}`
        );
      }
    }

    // 개발 모드에서 API 에러 로그
    if (config.isDev) {
      console.error('[API Error]', {
        appVersion: config.appVersion,
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        errorCode: error.code,
        normalizedError,
        originalError: error.response?.data,
      });
    }

    return Promise.reject(normalizedError);
  }
);
