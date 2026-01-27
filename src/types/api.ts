// API 에러 응답 (서버 ExceptionResponse 구조)
export interface ApiErrorResponse {
  traceId: string;
  status: number;
  code: string;
  message: string;
}

// 페이지네이션 응답 (필요시 사용)
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
