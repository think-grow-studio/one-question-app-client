import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query';
import { analysisApi } from '../../../api/analysisApi';
import {
  analysisHistoryQueryOptions,
  analysisKeys,
} from '../useAnalysisQueries';

jest.mock('../../../api/analysisApi', () => ({
  analysisApi: {
    getHistory: jest.fn(),
  },
}));

describe('analysisHistoryQueryOptions', () => {
  it('requests fresh history whenever the list mounts with cached data', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    queryClient.setQueryData(analysisKeys.history(), {
      pages: [{ items: [], hasNext: false, nextCursor: null }],
      pageParams: [null],
    });
    const getHistory = jest.mocked(analysisApi.getHistory);
    getHistory.mockResolvedValue({ items: [], hasNext: false, nextCursor: null });
    const observer = new InfiniteQueryObserver(
      queryClient,
      analysisHistoryQueryOptions(),
    );

    const unsubscribe = observer.subscribe(() => undefined);
    await Promise.resolve();

    expect(getHistory).toHaveBeenCalledWith(null);

    unsubscribe();
    getHistory.mockReset();
    queryClient.clear();
  });
});
