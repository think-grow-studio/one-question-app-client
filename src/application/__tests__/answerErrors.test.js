import { AxiosError } from 'axios';
import { apiClient } from '@/platform/http/apiClient';
import { queryClient, configureQueryRuntime } from '@/platform/query/queryClient';
import { useApiErrorStore } from '@/shared/stores/useApiErrorStore';
import { useCreateAnswer, useUpdateAnswer } from '@/features/question/hooks/mutations/useQuestionMutations';
import { useCreatePublicAnswer, useUpdatePublicAnswer } from '@/features/feed/hooks/mutations/usePublicQuestionMutations';

jest.mock('@/constants/config', () => ({ config: { apiUrl: 'https://example.test', isDev: false } }));
jest.mock('@/platform/firebase', () => ({ recordError: jest.fn() }));
jest.mock('@/platform/storage/storage', () => ({ storage: { getAccessToken: jest.fn().mockResolvedValue('token') } }));
// Run the real mutation/cache/interceptor path, replacing only React mounting and the HTTP adapter.
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => require('@/platform/query/queryClient').queryClient,
  useMutation: (options) => {
    const client = require('@/platform/query/queryClient').queryClient;
    return client.getMutationCache().build(client, { ...options, retryDelay: 0, gcTime: Infinity });
  },
}));

const adapter = apiClient.defaults.adapter;
const input = { date: '2026-10-31', answer: 'draft', content: 'draft', pdqId: 1, answerId: 2 };
beforeEach(() => {
  configureQueryRuntime({ onGlobalError: (error) => useApiErrorStore.getState().showError(error.message, error.requestId) });
});
afterEach(() => {
  apiClient.defaults.adapter = adapter;
  queryClient.clear();
  useApiErrorStore.getState().hideError();
});

describe.each([useCreateAnswer, useUpdateAnswer, useCreatePublicAnswer, useUpdatePublicAnswer])('%p', (hook) => {
  it.each(['ERR_NETWORK', 'ECONNABORTED', '503'])('shows a global error after %s exhausts its retry', async (failure) => {
    let attempts = 0;
    apiClient.defaults.adapter = async (config) => {
      attempts++;
      throw new AxiosError('unavailable', failure, config, undefined,
        failure === '503' ? { status: 503, statusText: 'Unavailable', data: {}, headers: {}, config } : undefined);
    };
    await expect(hook().execute(input)).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' });
    expect(attempts).toBe(2);
    expect(useApiErrorStore.getState()).toMatchObject({ isVisible: true, message: expect.any(String) });
    expect(useApiErrorStore.getState().message.length).toBeGreaterThan(5);
  });
});

it('keeps duplicate personal answers local instead of showing a second global dialog', async () => {
  const onDuplicateAnswer = jest.fn();
  apiClient.defaults.adapter = async (config) => {
    throw new AxiosError('duplicate', 'ERR_BAD_REQUEST', config, undefined, {
      status: 400, statusText: 'Bad Request', headers: {}, config,
      data: { code: 'QUESTION-004', message: '이미 답변한 질문이에요.' },
    });
  };
  await expect(useCreateAnswer({ onDuplicateAnswer }).execute(input)).rejects.toMatchObject({ code: 'QUESTION-004' });
  expect(onDuplicateAnswer).toHaveBeenCalledTimes(1);
  expect(useApiErrorStore.getState().isVisible).toBe(false);
});
