import { getAnalysisStatusColor } from '../analysisStatusColors';
const COLORS = {
  pending: 'warning-token',
  completed: 'success-token',
  failed: 'error-token',
};

describe('getAnalysisStatusColor', () => {
  it.each([
    ['PENDING', 'warning-token'],
    ['COMPLETED', 'success-token'],
    ['FAILED', 'error-token'],
  ] as const)('maps %s to its semantic theme color', (status, expected) => {
    expect(getAnalysisStatusColor(status, COLORS)).toBe(expected);
  });
});
