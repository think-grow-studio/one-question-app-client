import axios, { AxiosError, type AxiosAdapter } from 'axios';
import { apiClient, configureHttpRuntime } from '../apiClient';
import { storage } from '@/platform/storage/storage';
import { queryClient, configureQueryRuntime } from '@/platform/query/queryClient';

jest.mock('@/constants/config', () => ({ config: { apiUrl: 'https://example.test', isDev: false } }));
jest.mock('@/platform/firebase', () => ({ recordError: jest.fn() }));
jest.mock('@/platform/storage/storage', () => ({ storage: {
  getAccessToken: jest.fn(), getRefreshToken: jest.fn(), setTokens: jest.fn(),
} }));
jest.mock('@/locales', () => ({ __esModule: true, default: { language: 'ko', t: (key: string) => key } }));

const unauthorized: AxiosAdapter = async (config) => {
  throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config,
  });
};
const onUnauthorized = jest.fn().mockResolvedValue(undefined);
const onGlobalError = jest.fn();
const originalAdapter = apiClient.defaults.adapter;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(storage.getAccessToken).mockResolvedValue('old-access');
  jest.mocked(storage.getRefreshToken).mockResolvedValue('refresh');
  configureHttpRuntime({ onUnauthorized });
  configureQueryRuntime({ onGlobalError });
  apiClient.defaults.adapter = unauthorized;
});
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  queryClient.clear();
  jest.restoreAllMocks();
});

it('normalizes refresh rejection to a terminal 401 without a global dialog', async () => {
  const post = jest.spyOn(axios, 'post').mockRejectedValue(new AxiosError('Refresh failed', 'ERR_BAD_REQUEST'));
  await expect(queryClient.fetchQuery({
    queryKey: ['refresh-failure'], queryFn: () => apiClient.get('/private'), retryDelay: 0,
  })).rejects.toMatchObject({ status: 401 });
  expect(post).toHaveBeenCalledTimes(1);
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
  expect(onGlobalError).not.toHaveBeenCalled();
});

it('shares one refresh across concurrent 401 requests and retries with new tokens', async () => {
  let token = 'old-access';
  jest.mocked(storage.getAccessToken).mockImplementation(async () => token);
  jest.mocked(storage.setTokens).mockImplementation(async (access) => { token = access; });
  const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
  apiClient.defaults.adapter = async (config) => {
    if (config.headers.Authorization === 'Bearer old-access') return unauthorized(config);
    return { status: 200, statusText: 'OK', headers: {}, config, data: 'success' };
  };
  const responses = await Promise.all([apiClient.get('/one'), apiClient.get('/two')]);
  expect(responses.map((response) => response.data)).toEqual(['success', 'success']);
  expect(post).toHaveBeenCalledTimes(1);
  expect(onUnauthorized).not.toHaveBeenCalled();
});

it('ends the session when the refreshed token is also rejected', async () => {
  jest.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
  await expect(apiClient.get('/private')).rejects.toMatchObject({ status: 401 });
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

it('reuses the new token when an older request returns 401 after refresh finished', async () => {
  let token = 'old-access';
  let releaseLateRequest!: () => void;
  const lateRequest = new Promise<void>((resolve) => { releaseLateRequest = resolve; });
  jest.mocked(storage.getAccessToken).mockImplementation(async () => token);
  jest.mocked(storage.setTokens).mockImplementation(async (access) => { token = access; });
  const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
  apiClient.defaults.adapter = async (config) => {
    if (config.headers.Authorization === 'Bearer old-access') {
      if (config.url === '/late') await lateRequest;
      return unauthorized(config);
    }
    return { status: 200, statusText: 'OK', headers: {}, config, data: 'success' };
  };
  const late = apiClient.get('/late');
  await apiClient.get('/first');
  releaseLateRequest();
  await expect(late).resolves.toMatchObject({ data: 'success' });
  expect(post).toHaveBeenCalledTimes(1);
});
