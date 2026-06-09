// =====================================================================
// AI 분석 ("나를 만나는 시간") 도메인 타입
// 서버 스펙(제안): /api/v1/analyses/*  — docs/ai-analysis-feature-plan.md §6
// 서버 확정 전까지 api/mockAnalysis.ts 가 이 계약을 구현한다.
// =====================================================================

/** 분석 종류 — 한 번에 하나만 요청 */
export type AnalysisType = 'THINKING_PATTERN' | 'WARM_COMFORT';

/** 분석 1건의 처리 상태 (서버측 생애주기) */
export type AnalysisStatus = 'PROCESSING' | 'READY' | 'FAILED';

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

export interface CreateAnalysisRequest {
  type: AnalysisType;
  /** 선택한 답변들의 dailyAnswerId (최소 10, 최대 15) */
  dailyAnswerIds: number[];
}

export interface CreateAnalysisResponse {
  analysisId: number;
  status: AnalysisStatus;
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

/** 따듯한 위로 결과 — 편지/서사형 본문 */
export interface WarmComfortResult {
  /** 줄바꿈(\n\n) 포함 편지체 본문 */
  letter: string;
}

export type AnalysisResultPayload =
  | { type: 'THINKING_PATTERN'; data: ThinkingPatternResult }
  | { type: 'WARM_COMFORT'; data: WarmComfortResult };

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
