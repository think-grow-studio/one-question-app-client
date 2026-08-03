// =====================================================================
// AI 분석 ("나를 만나는 시간") 도메인 타입
//
// 생성 API(POST /api/v1/analysis-reports)는 **서버 명세 확정본**을 반영한다.
// 조회 계열(가용성/결과/히스토리/피드백)은 아직 명세가 없어 제안 계약 그대로이며,
// api/mockAnalysis.ts 가 그 부분을 구현한다. 확정되면 이 파일부터 맞출 것.
// =====================================================================

/** 분석 종류 — 한 번에 하나만 요청 */
export type AnalysisType = 'THINKING_PATTERN' | 'WARM_REFLECTION';

/**
 * 분석 1건의 처리 상태.
 * `PENDING`은 생성 API가 접수 직후 돌려주는 값(확정). PROCESSING/READY/FAILED는
 * 조회 API 명세가 없어 아직 제안 상태다 — 확정되면 정리할 것.
 */
export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

/** 요청 가용성 판정 사유 (서버가 최종 판정 — 클라 시계 조작 방지) */
export type AvailabilityReason =
  | 'OK' // 요청 가능
  | 'INSUFFICIENT_ANSWERS' // 답변 부족 (< requiredCount)
  | 'COOLDOWN' // 이번 주 이미 사용
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

/** 202 Accepted — "접수"일 뿐 리포트 완성이 아니다. 결과는 별도 조회로 폴링한다. */
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

// --- 결과 페이로드 (종류별로 형태가 다름) ---

/** 사고 패턴 분석 결과 — 요약 + 섹션형 */
export interface ThinkingPatternResult {
  summary: string;
  sections: {
    key: string; // 'patterns' | 'emotions' | 'perspectives' ...
    title: string;
    items: string[];
  }[];
}

/** 따듯한 회고 편지 결과 — 편지/서사형 본문 */
export interface WarmReflectionResult {
  /** 줄바꿈(\n\n) 포함 편지체 본문 */
  letter: string;
}

export type AnalysisResultPayload =
  | { type: 'THINKING_PATTERN'; data: ThinkingPatternResult }
  | { type: 'WARM_REFLECTION'; data: WarmReflectionResult };

/** 사용자 평가 */
export type AnalysisFeedback = 'GOOD' | 'OKAY' | 'BAD';

export interface AnalysisDetailDto {
  id: number;
  type: AnalysisType;
  status: AnalysisStatus;
  /** READY 일 때만 채워짐 */
  result: AnalysisResultPayload | null;
  /** 분석에 사용된 답변 개수 */
  answerCount: number;
  createdAt: string; // ISO-8601
  /** 사용자가 남긴 평가 (없으면 null) */
  feedback: AnalysisFeedback | null;
}

export interface AnalysisHistoryItemDto {
  id: number;
  type: AnalysisType;
  status: AnalysisStatus;
  createdAt: string;
}

export interface AnalysisHistoryResponse {
  items: AnalysisHistoryItemDto[];
  nextCursor: number | null;
}

// --- FCM 페이로드 (서버 → 클라, 분석 완료 알림) ---
export interface AnalysisDonePushData {
  type: 'ANALYSIS_DONE';
  analysisId: string; // FCM data 는 문자열로 전달됨
}
