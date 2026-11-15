import {
  fromHistoryItem,
  fromPastQuestionsResponse,
  spendsChangeCount,
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
          likeCount: 0,
        },
        answer: null,
        candidates: [
          {
            questionId: 5,
            content: '오늘 아침 기분은 어땠나요?',
            description: null,
            receivedOrder: 1,
            selected: false,
            likeCount: 0,
          },
          {
            questionId: 3,
            content: '오늘 가장 감사했던 순간은?',
            description: null,
            receivedOrder: 2,
            selected: true,
            likeCount: 5,
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
          likeCount: 0,
        },
        {
          questionId: 3,
          content: '오늘 가장 감사했던 순간은?',
          description: null,
          receivedOrder: 2,
          selected: true,
          likeCount: 5,
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
        likeCount: 0,
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

  describe('fromPastQuestionsResponse', () => {
    it('과거 질문 목록을 도메인으로 매핑한다', () => {
      const result = fromPastQuestionsResponse({
        available: true,
        message: null,
        questions: [
          {
            questionId: 7,
            content: '오늘 하루에 제목을 붙인다면?',
            description: 'ex) 폭풍 전야',
            assignedDates: ['2025-11-15', '2023-11-15'],
            inCandidates: false,
          },
        ],
      });

      expect(result).toEqual({
        available: true,
        message: null,
        questions: [
          {
            questionId: 7,
            content: '오늘 하루에 제목을 붙인다면?',
            description: 'ex) 폭풍 전야',
            assignedDates: ['2025-11-15', '2023-11-15'],
            inCandidates: false,
          },
        ],
      });
    });

    it('과거 질문이 없을 때 안내 문구를 유지하고 목록이 null 이어도 빈 배열로 만든다', () => {
      const result = fromPastQuestionsResponse({
        available: false,
        message: '아직 돌아볼 과거 질문이 없어요.',
        // 서버가 빈 목록을 null 로 내려주는 경우 방어
        questions: null as unknown as [],
      });

      expect(result).toEqual({
        available: false,
        message: '아직 돌아볼 과거 질문이 없어요.',
        questions: [],
      });
    });
  });

  describe('spendsChangeCount', () => {
    const question = (inCandidates: boolean) => ({
      questionId: 7,
      content: '오늘 하루에 제목을 붙인다면?',
      description: null,
      assignedDates: ['2025-11-15'],
      inCandidates,
    });

    it('재할당이고 오늘 후보에 없던 질문이면 변경 횟수를 차감한다', () => {
      expect(spendsChangeCount('reload', question(false))).toBe(true);
    });

    it('재할당이어도 오늘 후보에 이미 있는 질문이면 차감하지 않는다', () => {
      expect(spendsChangeCount('reload', question(true))).toBe(false);
    });

    it('첫 질문 받기는 차감하지 않는다', () => {
      expect(spendsChangeCount('serve', question(false))).toBe(false);
    });
  });
});
