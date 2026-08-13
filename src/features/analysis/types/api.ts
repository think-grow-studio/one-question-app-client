// =====================================================================
// AI 분석 ("나를 만나는 시간") 도메인 타입
//
// 생성·목록·상세는 /v3/api-docs의 AnalysisReport 계약을 반영한다.
// 가용성 조회만 서버 API가 없어 mock을 사용한다.
// =====================================================================

/** 분석 종류 — 한 번에 하나만 요청 */
export type AnalysisType = 'THINKING_PATTERN' | 'WARM_REFLECTION';

/**
 * 분석 1건의 처리 상태.
 * 서버는 접수/처리 중을 모두 `PENDING`, 완료를 `COMPLETED`로 표현한다.
 */
export type AnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/** 요청 가용성 판정 사유 (서버가 최종 판정 — 클라 시계 조작 방지) */
export type AvailabilityReason =
  | 'OK' // 요청 가능
  | 'INSUFFICIENT_ANSWERS' // 답변 부족 (< requiredCount)
  | 'COOLDOWN' // 현재 이용 기간의 생성 제한
  | 'PROCESSING'; // 진행 중인 분석 존재

export interface AnalysisAvailability {
  canRequest: boolean;
  reason: AvailabilityReason;
  /** 누적 답변 수 */
  answerCount: number;
  /** 분석에 필요한 최소 답변 수 (기본 10) */
  requiredCount: number;
  /** COOLDOWN 일 때 다음 분석 가능 시각 (ISO-8601). 그 외 null */
  nextAvailableAt: string | null;
  /** PROCESSING 일 때 진행 중 분석 id. 그 외 null */
  processingId: number | null;
}

// --- 생성 (확정 명세) ---

export interface CreateAnalysisRequest {
  reportType: AnalysisType;
  /** 선택한 답변들의 dailyAnswerId. 정확히 10~15개, 중복 불가, 본인 소유만 */
  dailyQuestionAnswerIds: number[];
}

/** 202 Accepted — "접수"일 뿐 리포트 완성이 아니다. */
export interface CreateAnalysisResponse {
  /** 백그라운드 작업 ID */
  jobId: number;
  /** 생성된 리포트 ID — 이후 결과 조회에 사용 */
  analysisReportId: number;
  reportType: AnalysisType;
  /** 생성 직후 항상 'PENDING' */
  status: AnalysisStatus;
  /** 요청 접수 시각 (ISO-8601) */
  requestedAt: string;
}

export interface AnalysisReportSourceDto {
  questionDate: string;
  questionContent: string;
  answerContent: string;
}

export interface AnalysisDetailDto {
  analysisReportId: number;
  reportType: AnalysisType;
  status: AnalysisStatus;
  /** COMPLETED일 때만 채워지는 최종 표시 본문 */
  result: string | null;
  sources: AnalysisReportSourceDto[];
  requestedAt: string;
}

export interface AnalysisHistoryItemDto {
  analysisReportId: number;
  reportType: AnalysisType;
  status: AnalysisStatus;
  requestedAt: string;
}

export interface AnalysisHistoryResponse {
  items: AnalysisHistoryItemDto[];
  hasNext: boolean;
  nextCursor: number | null;
}

// --- FCM 페이로드 (서버 → 클라, 분석 완료 알림) ---
export interface AnalysisDonePushData {
  type: 'ANALYSIS_DONE';
  analysisId: string; // FCM data 는 문자열로 전달됨
}
