// API 에러 응답 (서버 ExceptionResponse 구조)
export interface ApiErrorResponse {
  requestId: string;
  status: number;
  code: string;
  message: string;
}
