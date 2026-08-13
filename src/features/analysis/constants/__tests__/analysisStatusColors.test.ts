import { getAnalysisStatusColor } from '../analysisStatusColors';
import type { AnalysisStatus } from '../../types/api';

const STATUSES: AnalysisStatus[] = ['PENDING', 'COMPLETED', 'FAILED'];

describe('getAnalysisStatusColor', () => {
  it.each([false, true])('gives every status a distinct color when dark=%s', (dark) => {
    const colors = STATUSES.map((status) => getAnalysisStatusColor(status, dark));
    expect(new Set(colors).size).toBe(STATUSES.length);
  });

  it.each(STATUSES)('adapts %s to light and dark mode', (status) => {
    expect(getAnalysisStatusColor(status, false)).not.toBe(
      getAnalysisStatusColor(status, true),
    );
  });
});
