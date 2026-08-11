import { isAnalysisType } from '../analysisTypes';

describe('isAnalysisType', () => {
  it.each(['THINKING_PATTERN', 'WARM_REFLECTION'])(
    'accepts the supported report type %s',
    (value) => {
      expect(isAnalysisType(value)).toBe(true);
    },
  );

  it.each(['UNKNOWN', '', undefined])('rejects unsupported report type %s', (value) => {
    expect(isAnalysisType(value)).toBe(false);
  });
});
