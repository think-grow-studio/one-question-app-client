import type { AnalysisApi } from './analysisApi';
import type {
  AnalysisDetailDto,
  AnalysisFeedback,
  AnalysisResultPayload,
  AnalysisStatus,
  AnalysisType,
} from '../types/api';
import { MIN_ANSWERS } from '../constants/analysisTypes';
import { isAnalysisInProgress } from '../domain/analysisStatus';

// =====================================================================
// Mock 분석 백엔드 — 서버 확정 전 클릭 가능한 프로토타입용.
// PROCESSING → READY 전환을 시간 기반으로 시뮬레이션해서 폴링이 동작한다.
// 주의: 현재 이용 기간의 생성 제한은 테스트 편의를 위해 강제하지 않음(실서버가 판정).
// =====================================================================

/** 요청 후 이 시간이 지나면 READY 로 전환 (폴링으로 확인) */
const PROCESSING_MS = 8000;
/** 네트워크 지연 흉내 */
const LATENCY_MS = 400;

interface MockRecord {
  id: number;
  type: AnalysisType;
  answerCount: number;
  createdAt: number; // epoch ms
  feedback: AnalysisFeedback | null;
  /** 멱등 재요청 판별용 (시드 데이터엔 없음) */
  idempotencyKey?: string;
  /** true 면 항상 실패 상태로 둠 (FAILED 상태 데모용 — 현재 미사용) */
  forceFailed?: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

let seq = 1000;
const records: MockRecord[] = [
  // 시드: 이미 완료된 과거 분석 2건 (히스토리 표시용)
  {
    id: 1,
    type: 'THINKING_PATTERN',
    answerCount: 12,
    createdAt: Date.now() - 7 * DAY,
    feedback: 'GOOD',
  },
  {
    id: 2,
    type: 'WARM_REFLECTION',
    answerCount: 15,
    createdAt: Date.now() - 19 * DAY,
    feedback: null,
  },
];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function statusOf(record: MockRecord): AnalysisStatus {
  if (record.forceFailed) return 'FAILED';
  return Date.now() - record.createdAt >= PROCESSING_MS ? 'READY' : 'PROCESSING';
}

function mockResult(type: AnalysisType): AnalysisResultPayload {
  if (type === 'THINKING_PATTERN') {
    return {
      type: 'THINKING_PATTERN',
      data: {
        summary:
          '당신은 하루를 돌아볼 때 "잘 해냈는가"보다 "충분했는가"를 먼저 묻는 사람이에요. 성취보다 관계 속에서 의미를 찾고, 작은 순간을 오래 곱씹는 경향이 보여요.',
        sections: [
          {
            key: 'patterns',
            title: '반복되는 생각',
            items: [
              '결정을 내린 뒤에도 그 선택을 여러 번 되짚어 봐요.',
              '타인의 감정을 먼저 살피고, 내 needs는 뒤로 미루는 편이에요.',
            ],
          },
          {
            key: 'emotions',
            title: '감정의 흐름',
            items: [
              '평온함과 불안이 교차하지만, 끝에는 대체로 감사로 마무리돼요.',
              '혼자 있는 시간에서 에너지를 회복해요.',
            ],
          },
          {
            key: 'perspectives',
            title: '새로운 관점',
            items: [
              '"충분함"의 기준을 스스로 정해보면 어떨까요. 당신은 이미 자주 충분했어요.',
            ],
          },
        ],
      },
    };
  }
  return {
    type: 'WARM_REFLECTION',
    data: {
      letter:
        '요즘의 당신에게,\n\n쌓아둔 답변들을 가만히 읽다 보니, 참 성실하게 하루하루를 마주해 온 사람이라는 게 느껴졌어요. 기쁜 날에도, 지친 날에도 당신은 도망치지 않고 자기 마음을 들여다봤더라고요.\n\n가끔은 스스로에게 너무 엄격했던 흔적도 보였어요. 그래도 괜찮아요. 그렇게 애써온 당신을, 오늘만큼은 조금 느슨하게 안아줬으면 좋겠어요.\n\n당신은 충분히 잘 해오고 있어요.',
    },
  };
}

function toDetail(record: MockRecord): AnalysisDetailDto {
  const status = statusOf(record);
  return {
    id: record.id,
    type: record.type,
    status,
    result: status === 'READY' ? mockResult(record.type) : null,
    answerCount: record.answerCount,
    createdAt: new Date(record.createdAt).toISOString(),
    feedback: record.feedback,
  };
}

function processingRecord(): MockRecord | undefined {
  return records.find((r) => isAnalysisInProgress(statusOf(r)));
}

export const mockAnalysisApi: AnalysisApi = {
  getAvailability: () => {
    const processing = processingRecord();
    if (processing) {
      return delay({
        canRequest: false,
        reason: 'PROCESSING' as const,
        answerCount: 15,
        requiredCount: MIN_ANSWERS,
        nextAvailableAt: null,
        processingId: processing.id,
      });
    }
    // mock 은 답변 15개 보유 + 쿨다운 미적용 → 항상 IDLE
    return delay({
      canRequest: true,
      reason: 'OK' as const,
      answerCount: 15,
      requiredCount: MIN_ANSWERS,
      nextAvailableAt: null,
      processingId: null,
    });
  },

  // 멱등키는 서버 계약이라 mock도 시그니처를 맞춘다. 같은 키로 재요청하면 같은
  // 응답을 돌려줘 실서버의 멱등 동작(202 재반환)까지 흉내낸다.
  createAnalysis: (req, idempotencyKey) => {
    const existing = records.find((r) => r.idempotencyKey === idempotencyKey);
    const record =
      existing ??
      ({
        id: ++seq,
        type: req.reportType,
        answerCount: req.dailyQuestionAnswerIds.length,
        createdAt: Date.now(),
        feedback: null,
        idempotencyKey,
      } as MockRecord);

    if (!existing) records.unshift(record);

    return delay({
      jobId: record.id,
      analysisReportId: record.id,
      reportType: record.type,
      status: 'PENDING' as const,
      requestedAt: new Date(record.createdAt).toISOString(),
    });
  },

  getAnalysis: (id) => {
    const record = records.find((r) => r.id === id);
    if (!record) {
      return Promise.reject(new Error(`mock analysis ${id} not found`));
    }
    return delay(toDetail(record));
  },

  getHistory: () =>
    delay({
      items: records.map((r) => ({
        id: r.id,
        type: r.type,
        status: statusOf(r),
        answerCount: r.answerCount,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
      nextCursor: null,
    }),

  submitFeedback: (id, feedback) => {
    const record = records.find((r) => r.id === id);
    if (record) record.feedback = feedback;
    return delay(undefined);
  },
};
