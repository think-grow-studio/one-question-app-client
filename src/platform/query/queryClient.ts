import { AppState, type AppStateStatus } from 'react-native';
import { MutationCache, QueryCache, QueryClient, focusManager } from '@tanstack/react-query';
import type { ApiErrorResponse } from '@/platform/http/types';

interface QueryRuntimeConfig {
  /** silent 코드가 아닌 모든 쿼리/뮤테이션 에러의 기본 표시 처리 — queryClient는 error store를 직접 모른다. */
  onGlobalError: (error: ApiErrorResponse) => void;
}

let queryRuntime: QueryRuntimeConfig | undefined;

/** app bootstrap에서 1회 호출해 queryClient가 필요로 하는 앱 레벨 콜백을 주입한다. */
export function configureQueryRuntime(runtimeConfig: QueryRuntimeConfig): void {
  queryRuntime = runtimeConfig;
}

// apiClient가 모든 응답 에러를 ApiErrorResponse로 정규화해서 reject하므로
// (실제 Error 인스턴스가 아님), TError 기본값을 프로젝트 전역에 등록한다.
// 이후 TError를 명시하지 않은 useQuery/useMutation도 자동으로 정확한 타입을 받는다.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiErrorResponse;
  }
}

/**
 * refetchOnWindowFocus를 React Native에서 실제로 동작하게 한다.
 * TanStack의 포커스 감지는 브라우저 이벤트 기반이라, 이 연결이 없으면
 * `refetchOnWindowFocus: true`가 앱 전체에서 조용히 무시된다.
 * (폴링을 쓰지 않는 화면은 이 경로가 유일한 자동 갱신 수단이다.)
 */
AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});

/**
 * 코드별 silent 처리 (dialog 표시 생략).
 * 호출자에서 try/catch로 도메인 후속 처리 책임.
 */
const SILENT_ERROR_CODES = new Set<string>([
  'QUESTION-004',
  // 공개 일일 질문 — 404/409 중 글로벌 dialog 가 어색한 코드들.
  // 003: 그 날짜에 PDQ 없음 → 화면이 빈 상태로 분기. dialog 불필요.
  // 004: 이미 답변 → 컴포넌트 local dialog + daily refetch.
  // 005: 답변 없음/권한 없음 → 컴포넌트 local dialog + daily refetch.
  'PUBLIC-QUESTION-003',
  'PUBLIC-QUESTION-004',
  'PUBLIC-QUESTION-005',
]);

const handleApiError = (error: ApiErrorResponse) => {
  if (!error?.code) return;
  if (SILENT_ERROR_CODES.has(error.code)) return;
  queryRuntime?.onGlobalError(error);
};

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
 * - 408 Timeout / 429 Rate Limit: 재시도
 *   (apiClient가 에러를 ApiErrorResponse{requestId,status,code,message}로
 *   정규화하며 원본 응답 헤더는 버리므로 Retry-After 기반 분기는 여기서 불가능 —
 *   필요해지면 apiClient 정규화 단계에서 헤더 값을 실어 보내야 한다)
 * - 401 Unauthorized: 재시도 안 함 (apiClient에서 이미 token refresh 처리)
 * - 4xx 클라이언트 에러(408/429 제외): 재시도 안 함
 * - 네트워크 에러: 재시도
 */
const shouldRetry = (failureCount: number, error: ApiErrorResponse) => {
  // 최대 1회 재시도
  if (failureCount >= 1) return false;

  const status = error?.status;

  // 401은 apiClient에서 이미 처리됨 (token refresh 시도 완료)
  // 여기서 재시도하면 불필요한 중복 요청 발생
  if (status === 401) return false;

  // 4xx 에러는 재시도 안 함 (408, 429 제외)
  if (status >= 400 && status < 500) {
    return status === 408 || status === 429;
  }

  // 5xx, 네트워크 에러는 재시도
  return true;
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 백그라운드 prefetch 등 사용자 인터랙션 없는 조회의 실패는 dialog 생략.
      // (해당 쿼리를 실제 화면이 다시 조회하면 그땐 meta 없이 fetch되어 정상 표시됨)
      if (query.meta?.suppressGlobalError) return;
      handleApiError(error);
    },
  }),
  mutationCache: new MutationCache({ onError: handleApiError }),
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay: exponentialBackoff,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: ApiErrorResponse) => {
        // Mutation은 최대 1회 재시도
        if (failureCount >= 1) return false;

        const status = error?.status;
        // 5xx 또는 네트워크 에러만 재시도
        return !status || status >= 500;
      },
      retryDelay: exponentialBackoff,
    },
  },
});
