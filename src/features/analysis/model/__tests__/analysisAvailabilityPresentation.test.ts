import { getAnalysisStatusMessage, getCooldownDays } from '../analysisAvailabilityPresentation';
import type { AnalysisAvailability } from '../../types/api';

const base: AnalysisAvailability = {
  canRequest: false,
  reason: 'OK',
  answerCount: 12,
  requiredCount: 10,
  nextAvailableAt: null,
  processingId: null,
};

describe('getCooldownDays', () => {
  const now = new Date('2026-08-19T00:00:00Z').getTime();

  it('returns 0 when there is no next available date', () => {
    expect(getCooldownDays(null, now)).toBe(0);
  });

  it('rounds up to at least 1 day when the target is within a day', () => {
    expect(getCooldownDays('2026-08-19T01:00:00Z', now)).toBe(1);
  });

  it('rounds up partial days', () => {
    expect(getCooldownDays('2026-08-21T12:00:00Z', now)).toBe(3);
  });
});

describe('getAnalysisStatusMessage', () => {
  it('returns null while availability has not loaded', () => {
    expect(getAnalysisStatusMessage(undefined)).toBeNull();
  });

  it('returns null when the reason is OK (request enabled)', () => {
    expect(getAnalysisStatusMessage(base)).toBeNull();
  });

  it('surfaces progress counts for INSUFFICIENT_ANSWERS', () => {
    expect(
      getAnalysisStatusMessage({ ...base, reason: 'INSUFFICIENT_ANSWERS', answerCount: 3, requiredCount: 10 }),
    ).toEqual({ key: 'status.locked.progress', params: { current: 3, required: 10 } });
  });

  it('surfaces cooldown days for COOLDOWN', () => {
    const now = Date.now();
    const nextAvailableAt = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = getAnalysisStatusMessage({ ...base, reason: 'COOLDOWN', nextAvailableAt });
    expect(result?.key).toBe('status.cooldown.message');
    expect((result as { params: { days: number } }).params.days).toBeGreaterThanOrEqual(1);
  });

  it('surfaces a processing hint for PROCESSING', () => {
    expect(getAnalysisStatusMessage({ ...base, reason: 'PROCESSING' })).toEqual({
      key: 'list.processingHint',
    });
  });
});
