import type {
  ServeDailyQuestionResponse,
  QuestionHistoryItemDto,
  QuestionInfoDto,
  AnswerInfoDto,
  HistoryStatus,
  CreateAnswerResponse,
  UpdateAnswerResponse,
} from '@/types/api';

/**
 * 캐시용 도메인 모델
 * API 응답과 독립적으로 관리되는 도메인 타입
 */
export interface DailyQuestionDomain {
  date: string;
  status: HistoryStatus;
  question: QuestionInfoDto | null;
  answer: AnswerInfoDto | null;
}

/**
 * 히스토리 API 응답을 도메인 모델로 변환
 */
export function fromHistoryItem(item: QuestionHistoryItemDto): DailyQuestionDomain {
  return {
    date: item.date,
    status: item.status,
    question: item.question,
    answer: item.answer,
  };
}

/**
 * serveDailyQuestion 응답을 도메인 모델로 변환
 */
export function fromServeDailyQuestion(
  date: string,
  response: ServeDailyQuestionResponse
): DailyQuestionDomain {
  return {
    date,
    status: 'UNANSWERED',
    question: {
      dailyQuestionId: response.dailyQuestionId,
      content: response.content,
      description: response.description,
      questionCycle: response.questionCycle,
      changeCount: response.changeCount,
    },
    answer: null,
  };
}

/**
 * createAnswer 또는 updateAnswer 응답으로 도메인 모델의 answer 업데이트
 */
export function withAnswer(
  domain: DailyQuestionDomain,
  answer: CreateAnswerResponse | UpdateAnswerResponse
): DailyQuestionDomain {
  return {
    ...domain,
    status: 'ANSWERED',
    answer: {
      dailyAnswerId: answer.dailyAnswerId,
      content: answer.content,
      answeredAt: answer.answeredAt,
    },
  };
}
