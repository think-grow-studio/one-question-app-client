import { getNextAnalysisPageParam } from '../analysisPagination';
import type { AnalysisHistoryResponse } from '../../types/api';

function page(
  hasNext: boolean,
  nextCursor: number | null,
): AnalysisHistoryResponse {
  return { items: [], hasNext, nextCursor };
}

describe('getNextAnalysisPageParam', () => {
  it('returns the cursor only when the server says another page exists', () => {
    expect(getNextAnalysisPageParam(page(true, 21))).toBe(21);
  });

  it('stops when hasNext is false even if a cursor is present', () => {
    expect(getNextAnalysisPageParam(page(false, 21))).toBeUndefined();
  });

  it('stops when the next cursor is null', () => {
    expect(getNextAnalysisPageParam(page(true, null))).toBeUndefined();
  });
});
