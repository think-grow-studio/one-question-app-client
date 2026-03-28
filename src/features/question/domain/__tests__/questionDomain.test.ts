import { withAnswer, DailyQuestionDomain } from '../questionDomain';

describe('withAnswer', () => {
  const domain: DailyQuestionDomain = {
    date: '2025-03-15',
    status: 'UNANSWERED',
    question: {
      dailyQuestionId: 1,
      content: '질문',
      description: null,
      questionCycle: 1,
      changeCount: 0,
    },
    answer: null,
  };

  const answer = {
    dailyAnswerId: 10,
    content: '답변 내용',
    answeredAt: '2025-03-15T10:00:00',
  };

  it('답변 추가 시 status가 ANSWERED로 변경', () => {
    const result = withAnswer(domain, answer);
    expect(result.status).toBe('ANSWERED');
    expect(result.answer?.content).toBe('답변 내용');
  });

  it('원본 도메인은 변경되지 않음 (불변성)', () => {
    withAnswer(domain, answer);
    expect(domain.status).toBe('UNANSWERED');
    expect(domain.answer).toBeNull();
  });
});
