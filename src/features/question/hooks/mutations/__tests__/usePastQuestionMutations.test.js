import { queryClient, configureQueryRuntime } from '@/platform/query/queryClient';
import { questionApi } from '../../../api/questionApi';
import { useServePastQuestion, useReloadPastQuestion } from '../useQuestionMutations';

// React의 마운트 대신 실제 MutationCache로 훅 옵션을 실행한다. 에러 배선과 retry는 실 구현이다.
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => require('@/platform/query/queryClient').queryClient,
  useMutation: (options) => {
    const client = require('@/platform/query/queryClient').queryClient;
    return client.getMutationCache().build(client, { ...options, retryDelay: 0, gcTime: Infinity });
  },
}));
jest.mock('../../../api/questionApi', () => ({ questionApi: {
  servePastQuestion: jest.fn(), reloadPastQuestion: jest.fn(),
} }));

const date = '2026-11-15';
const dailyKey = ['question', 'daily', date];
const timelineKey = ['question', 'timeline'];
const calendarKey = ['calendar', 'month', '2026-11-15'];
const served = {
  dailyQuestionId: 43, questionId: 7, content: 'past question', description: null,
  questionCycle: 2, changeCount: 1, liked: false, likeCount: 3,
  candidates: [{ questionId: 7, content: 'past question', description: null, receivedOrder: 1, selected: true }],
};
const flows = [
  [useServePastQuestion, 'servePastQuestion', 'QUESTION-011'],
  [useReloadPastQuestion, 'reloadPastQuestion', 'QUESTION-008'],
];
const globalError = jest.fn();
beforeEach(() => { jest.clearAllMocks(); configureQueryRuntime({ onGlobalError: globalError }); });
afterEach(() => { queryClient.clear(); });

it.each(flows)('writes the served question to the daily cache in %p', async (hook, method) => {
  questionApi[method].mockResolvedValue({ data: served });
  queryClient.setQueryData(timelineKey, { pages: [], pageParams: [] });
  queryClient.setQueryData(calendarKey, []);

  await hook().execute({ date, questionId: 7 });

  expect(questionApi[method]).toHaveBeenCalledWith(date, { questionId: 7 });
  expect(queryClient.getQueryData(dailyKey)).toMatchObject({
    date, status: 'UNANSWERED', question: { questionId: 7, changeCount: 1 },
  });
  expect(queryClient.getQueryState(timelineKey).isInvalidated).toBe(true);
  expect(queryClient.getQueryState(calendarKey).isInvalidated).toBe(true);
});

it.each(flows)('resyncs the stale daily card and keeps the global dialog in %p', async (hook, method, code) => {
  questionApi[method].mockRejectedValue({ requestId: 'req', status: 409, code, message: 'server message' });
  queryClient.setQueryData(dailyKey, { date, status: 'NO_QUESTION', question: null, answer: null });

  await expect(hook().execute({ date, questionId: 7 })).rejects.toMatchObject({ code });

  expect(globalError).toHaveBeenCalledTimes(1);
  expect(queryClient.getQueryState(dailyKey).isInvalidated).toBe(true);
});

it.each(flows)('leaves the daily cache alone for unrelated errors in %p', async (hook, method) => {
  questionApi[method].mockRejectedValue({ requestId: 'req', status: 404, code: 'QUESTION-012', message: 'not past' });
  queryClient.setQueryData(dailyKey, { date, status: 'NO_QUESTION', question: null, answer: null });

  await expect(hook().execute({ date, questionId: 7 })).rejects.toMatchObject({ code: 'QUESTION-012' });

  expect(globalError).toHaveBeenCalledTimes(1);
  expect(queryClient.getQueryState(dailyKey).isInvalidated).toBe(false);
});
