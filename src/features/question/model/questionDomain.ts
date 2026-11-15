import type {
  CreateAnswerResponse,
  GetPastQuestionsResponse,
  HistoryStatus,
  QuestionCandidateDto,
  QuestionHistoryItemDto,
  ServeDailyQuestionResponse,
  UpdateAnswerResponse,
} from '../types/api';

export interface QuestionCandidateDomain {
  questionId: number;
  content: string;
  description: string | null;
  receivedOrder: number;
  selected: boolean;
  likeCount?: number;
}

export interface QuestionDomain {
  dailyQuestionId: number;
  questionId: number;
  content: string;
  description: string | null;
  questionCycle: number;
  changeCount: number;
  liked: boolean;
  likeCount?: number;
  candidates: QuestionCandidateDomain[];
}

export interface AnswerDomain {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
}

export interface DailyQuestionDomain {
  date: string;
  status: HistoryStatus;
  question: QuestionDomain | null;
  answer: AnswerDomain | null;
}

// 과거 질문 — 이전 사이클들의 같은 날에 최종 확정됐던 질문.
export interface PastQuestionDomain {
  questionId: number;
  content: string;
  description: string | null;
  assignedDates: string[]; // YYYY-MM-DD, 최신순
  inCandidates: boolean; // 오늘 후보에 이미 있음 → 재할당 시 변경 횟수 차감 없음
}

export interface PastQuestionsDomain {
  available: boolean;
  message: string | null; // available=false 일 때 노출할 서버 안내 문구
  questions: PastQuestionDomain[];
}

function toCandidateDomain(candidates: QuestionCandidateDto[] | null | undefined): QuestionCandidateDomain[] {
  if (!candidates?.length) {
    return [];
  }

  return candidates.map((candidate) => ({
    questionId: candidate.questionId,
    content: candidate.content,
    description: candidate.description,
    receivedOrder: candidate.receivedOrder,
    selected: candidate.selected,
    likeCount: candidate.likeCount,
  }));
}

export function fromHistoryItem(item: QuestionHistoryItemDto): DailyQuestionDomain {
  return {
    date: item.date,
    status: item.status,
    question: item.question
      ? {
          dailyQuestionId: item.question.dailyQuestionId,
          questionId: item.question.questionId,
          content: item.question.content,
          description: item.question.description,
          questionCycle: item.question.questionCycle,
          changeCount: item.question.changeCount,
          liked: item.question.liked,
          likeCount: item.question.likeCount,
          candidates: toCandidateDomain(item.candidates),
        }
      : null,
    answer: item.answer
      ? {
          dailyAnswerId: item.answer.dailyAnswerId,
          content: item.answer.content,
          answeredAt: item.answer.answeredAt,
        }
      : null,
  };
}

export function fromServeDailyQuestion(
  date: string,
  response: ServeDailyQuestionResponse
): DailyQuestionDomain {
  return {
    date,
    status: 'UNANSWERED',
    question: {
      dailyQuestionId: response.dailyQuestionId,
      questionId: response.questionId,
      content: response.content,
      description: response.description,
      questionCycle: response.questionCycle,
      changeCount: response.changeCount,
      liked: response.liked,
      likeCount: response.likeCount,
      candidates: toCandidateDomain(response.candidates),
    },
    answer: null,
  };
}

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

export function fromPastQuestionsResponse(response: GetPastQuestionsResponse): PastQuestionsDomain {
  return {
    available: response.available,
    message: response.message,
    questions: (response.questions ?? []).map((question) => ({
      questionId: question.questionId,
      content: question.content,
      description: question.description,
      assignedDates: question.assignedDates ?? [],
      inCandidates: question.inCandidates,
    })),
  };
}
