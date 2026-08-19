// features/auth의 로그인/재발급 플로우와 services(apiClient 401 재시도,
// tokenRefreshService)가 둘 다 필요로 해서 shared에 둔다 — layer 경계상
// services는 features를 임포트할 수 없다. 나머지 auth 요청/응답 타입은
// features/auth/types/api.ts.
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  isNewMember: boolean;
}
