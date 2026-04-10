import type {
  CreateAnswerResponse,
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
}

export interface QuestionDomain {
  dailyQuestionId: number;
  questionId: number;
  content: string;
  description: string | null;
  questionCycle: number;
  changeCount: number;
  liked: boolean;
  candidates: QuestionCandidateDomain[];
}

export interface AnswerDomain {
  dailyAnswerId: number;
  content: string;
  answeredAt: string;
  published: boolean;
}

export interface DailyQuestionDomain {
  date: string;
  status: HistoryStatus;
  question: QuestionDomain | null;
  answer: AnswerDomain | null;
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
          candidates: toCandidateDomain(item.candidates),
        }
      : null,
    answer: item.answer
      ? {
          dailyAnswerId: item.answer.dailyAnswerId,
          content: item.answer.content,
          answeredAt: item.answer.answeredAt,
          published: item.answer.published,
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
      published: answer.published,
    },
  };
}
