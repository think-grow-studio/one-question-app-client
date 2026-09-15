import { queryClient, configureQueryRuntime } from '@/platform/query/queryClient';
import { publicQuestionApi } from '../../../api/publicQuestionApi';
import { useCreatePublicAnswer, useUpdatePublicAnswer, useDeletePublicAnswer } from '../usePublicQuestionMutations';
import i18n from '@/locales';

// React의 마운트 대신 실제 MutationCache로 훅 옵션을 실행한다. 에러 배선과 retry는 실 구현이다.
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => require('@/platform/query/queryClient').queryClient,
  useMutation: (options) => {
    const client = require('@/platform/query/queryClient').queryClient;
    return client.getMutationCache().build(client, { ...options, retryDelay: 0, gcTime: Infinity });
  },
}));
jest.mock('../../../api/publicQuestionApi', () => ({ publicQuestionApi: {
  createAnswer: jest.fn(), updateAnswer: jest.fn(), deleteAnswer: jest.fn(),
} }));

const flows = [
  [useCreatePublicAnswer, 'createAnswer', 'onAlreadyAnswered', 'PUBLIC-QUESTION-004', 'error.public-question.answer-already-exists'],
  [useUpdatePublicAnswer, 'updateAnswer', 'onAnswerGone', 'PUBLIC-QUESTION-005', 'error.public-question.answer-not-found'],
  [useDeletePublicAnswer, 'deleteAnswer', 'onAnswerGone', 'PUBLIC-QUESTION-005', 'error.public-question.answer-not-found'],
];
const input = { pdqId: 1, answerId: 2, date: '2026-09-15', content: 'answer' };
const globalError = jest.fn();
beforeEach(() => { jest.clearAllMocks(); configureQueryRuntime({ onGlobalError: globalError }); });
afterEach(() => { queryClient.clear(); });

describe.each(['ko', 'en'])('%s local error messages', (language) => {
  it.each(flows)('translates the handled error from %p', async (hook, method, callback, code, key) => {
    await i18n.changeLanguage(language);
    const localError = jest.fn();
    publicQuestionApi[method].mockRejectedValue({ requestId: 'req', status: 400, code, message: key });
    const mutation = hook({ [callback]: localError });
    await expect(mutation.execute(input)).rejects.toMatchObject({ code });
    expect(globalError).not.toHaveBeenCalled();
    expect(localError).toHaveBeenCalledTimes(1);
    const { message, syncQueries } = localError.mock.calls[0][0];
    expect(message).not.toMatch(/^error\.|^errors\.|^feed:/);
    expect(message.length).toBeGreaterThan(5);
    queryClient.setQueryData(['publicQuestion', 'daily', input.date], { myAnswer: null });
    syncQueries();
    expect(queryClient.getQueryState(['publicQuestion', 'daily', input.date]).isInvalidated).toBe(true);
  });
});

it.each(flows)('keeps network and 5xx global errors enabled in %p', async (hook, method, callback) => {
  for (const status of [0, 503]) {
    globalError.mockClear();
    const localError = jest.fn();
    publicQuestionApi[method].mockRejectedValue({ requestId: 'req', status, code: 'UNKNOWN_ERROR', message: 'unavailable' });
    await expect(hook({ [callback]: localError }).execute(input)).rejects.toMatchObject({ status });
    expect(globalError).toHaveBeenCalledTimes(1);
    expect(localError).not.toHaveBeenCalled();
  }
});
