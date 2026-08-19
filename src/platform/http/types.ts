// API 에러 응답 (서버 ExceptionResponse 구조)
export interface ApiErrorResponse {
  requestId: string;
  status: number;
  code: string;
  message: string;
}

/** POST /auth/reissue-token 응답 — features/auth의 로그인 응답과 서버 shape가
 * 우연히 겹치더라도 tokenRefreshService가 실제로 쓰는 필드만 별도로 정의한다. */
export interface ReissueTokenResponse {
  accessToken: string;
  refreshToken: string;
}
