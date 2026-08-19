jest.mock('@/platform/http/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { apiClient } from '@/platform/http/apiClient';
import { analysisApi } from '../analysisApi';
import type {
  AnalysisDetailDto,
  AnalysisHistoryResponse,
} from '../../types/api';

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

describe('analysisApi read endpoints', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('requests the first report page from the analysis-reports endpoint', async () => {
    const response: AnalysisHistoryResponse = {
      items: [],
      hasNext: false,
      nextCursor: null,
    };
    mockedGet.mockResolvedValueOnce({ data: response });

    await expect(analysisApi.getHistory()).resolves.toEqual(response);
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/analysis-reports', {
      params: undefined,
    });
  });

  it('passes the previous nextCursor when requesting another report page', async () => {
    const response: AnalysisHistoryResponse = {
      items: [],
      hasNext: false,
      nextCursor: null,
    };
    mockedGet.mockResolvedValueOnce({ data: response });

    await analysisApi.getHistory(21);

    expect(mockedGet).toHaveBeenCalledWith('/api/v1/analysis-reports', {
      params: { cursor: 21 },
    });
  });

  it('requests a report detail by analysisReportId', async () => {
    const response: AnalysisDetailDto = {
      analysisReportId: 42,
      reportType: 'WARM_REFLECTION',
      status: 'COMPLETED',
      result: '분석 결과입니다.',
      sources: [],
      requestedAt: '2026-08-13T09:00:00Z',
    };
    mockedGet.mockResolvedValueOnce({ data: response });

    await expect(analysisApi.getAnalysis(42)).resolves.toEqual(response);
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/analysis-reports/42');
  });
});
