import { QueryClient } from '@tanstack/react-query';

/**
 * Exponential Backoff with Jitter
 *
 * 재시도 간격: 1s → 2s → 4s (최대 10s)
 * Jitter: 0-500ms 랜덤 지연 추가 (thundering herd 방지)
 */
const exponentialBackoff = (attemptIndex: number) => {
  const baseDelay = Math.min(1000 * 2 ** attemptIndex, 10000); // 최대 10초
  const jitter = Math.random() * 500; // 0-500ms
  return baseDelay + jitter;
};

/**
 * Selective Retry Strategy
 *
 * 재시도 조건:
 * - 5xx 서버 에러: 재시도
 * - 408 Timeout: 재시도
 * - 429 Rate Limit: 재시도 (Retry-After 헤더 고려)
 * - 401 Unauthorized: 재시도 안 함 (apiClient에서 이미 token refresh 처리)
 * - 4xx 클라이언트 에러: 재시도 안 함
 * - 네트워크 에러: 재시도
 */
const shouldRetry = (failureCount: number, error: any) => {
  // 최대 3회 재시도
  if (failureCount >= 3) return false;

  const status = error?.status;

  // 401은 apiClient에서 이미 처리됨 (token refresh 시도 완료)
  // 여기서 재시도하면 불필요한 중복 요청 발생
  if (status === 401) return false;

  // 429 Rate Limit: Retry-After 헤더 확인
  if (status === 429) {
    const retryAfter = error.response?.headers?.['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      // 60초 이상 대기가 필요하면 재시도 안 함 (UX 저하)
      if (!isNaN(seconds) && seconds > 60) return false;
    }
    return true;
  }

  // 4xx 에러는 재시도 안 함 (408, 429 제외)
  if (status >= 400 && status < 500) {
    return status === 408;
  }

  // 5xx, 네트워크 에러는 재시도
  return true;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay: exponentialBackoff,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Mutation은 더 보수적 (최대 2회)
        if (failureCount >= 2) return false;

        const status = error?.status;
        // 5xx 또는 네트워크 에러만 재시도
        return !status || status >= 500;
      },
      retryDelay: exponentialBackoff,
    },
  },
});
