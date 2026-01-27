import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/constants/config';
import { storage } from './storage';
import { useApiErrorStore } from '@/stores/useApiErrorStore';
import { ApiErrorResponse } from '@/types/api';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - 토큰 주입
apiClient.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    const token = await storage.getAccessToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - 에러 처리 + 팝업 표시
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config;

    // 401 처리 (토큰 만료)
    if (error.response?.status === 401 && originalRequest) {
      // TODO: Token refresh 로직 구현
      // const newToken = await authService.refreshAccessToken();
      // if (newToken) {
      //   originalRequest.headers.Authorization = `Bearer ${newToken}`;
      //   return apiClient(originalRequest);
      // }
    }

    // 서버에서 전달한 에러 메시지 사용 (fallback: 기본 메시지)
    const errorMessage = error.response?.data?.message
      || error.message
      || '알 수 없는 오류가 발생했습니다.';

    // 전역 에러 스토어를 통해 팝업 표시
    useApiErrorStore.getState().showError(errorMessage);

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
