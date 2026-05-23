import {
  fromHistoryItem,
  withAnswer,
  type DailyQuestionDomain,
} from '../questionDomain';

describe('questionDomain', () => {
  describe('fromHistoryItem', () => {
    it('UNANSWERED 히스토리의 top-level candidates를 question.candidates로 매핑한다', () => {
      const result = fromHistoryItem({
        date: '2025-03-15',
        status: 'UNANSWERED',
        question: {
          dailyQuestionId: 1,
          questionId: 3,
          content: '오늘 가장 감사했던 순간은?',
          description: null,
          questionCycle: 1,
          changeCount: 1,
          liked: false,
        },
        answer: null,
        candidates: [
          {
            questionId: 5,
            content: '오늘 아침 기분은 어땠나요?',
            description: null,
            receivedOrder: 1,
            selected: false,
          },
          {
            questionId: 3,
            content: '오늘 가장 감사했던 순간은?',
            description: null,
            receivedOrder: 2,
            selected: true,
          },
        ],
      });

      expect(result.question?.candidates).toEqual([
        {
          questionId: 5,
          content: '오늘 아침 기분은 어땠나요?',
          description: null,
          receivedOrder: 1,
          selected: false,
        },
        {
          questionId: 3,
          content: '오늘 가장 감사했던 순간은?',
          description: null,
          receivedOrder: 2,
          selected: true,
        },
      ]);
    });
  });

  describe('withAnswer', () => {
    const domain: DailyQuestionDomain = {
      date: '2025-03-15',
      status: 'UNANSWERED',
      question: {
        dailyQuestionId: 1,
        questionId: 1,
        content: '질문',
        description: null,
        questionCycle: 1,
        changeCount: 0,
        liked: false,
        candidates: [],
      },
      answer: null,
    };

    const answer = {
      dailyAnswerId: 10,
      content: '답변 내용',
      answeredAt: '2025-03-15T10:00:00',
    };

    it('답변 추가 시 status가 ANSWERED로 변경된다', () => {
      const result = withAnswer(domain, answer);
      expect(result.status).toBe('ANSWERED');
      expect(result.answer?.content).toBe('답변 내용');
    });

    it('원본 도메인은 변경되지 않는다', () => {
      withAnswer(domain, answer);
      expect(domain.status).toBe('UNANSWERED');
      expect(domain.answer).toBeNull();
    });
  });
});
