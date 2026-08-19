import {
  getAnalysisDetailPresentationState,
  getAnalysisStatusLabelKey,
  isAnalysisReportOpenable,
  parseAnalysisReportId,
} from '../analysisPresentation';
import type { AnalysisDetailDto } from '../../types/api';

describe('getAnalysisStatusLabelKey', () => {
  it.each([
    ['PENDING', 'list.processing'],
    ['COMPLETED', 'list.completed'],
    ['FAILED', 'list.failed'],
  ] as const)('%s status always has a visible label', (status, expected) => {
    expect(getAnalysisStatusLabelKey(status)).toBe(expected);
  });
});

describe('isAnalysisReportOpenable', () => {
  it('allows navigation only for completed reports', () => {
    expect(isAnalysisReportOpenable('COMPLETED')).toBe(true);
    expect(isAnalysisReportOpenable('PENDING')).toBe(false);
    expect(isAnalysisReportOpenable('FAILED')).toBe(false);
  });
});

describe('parseAnalysisReportId', () => {
  it('parses a positive integer report id', () => {
    expect(parseAnalysisReportId('42')).toBe(42);
  });

  it.each([undefined, '', '0', '-1', '1.5', 'report'])('rejects invalid route id %s', (value) => {
    expect(parseAnalysisReportId(value)).toBeNull();
  });
});

describe('getAnalysisDetailPresentationState', () => {
  const completed: AnalysisDetailDto = {
    analysisReportId: 42,
    reportType: 'THINKING_PATTERN',
    status: 'COMPLETED',
    result: '분석 결과',
    sources: [],
    requestedAt: '2026-08-13T09:00:00Z',
  };

  it('shows completed content only when a completed report has usable text', () => {
    expect(
      getAnalysisDetailPresentationState({
        reportId: 42,
        isLoading: false,
        isError: false,
        detail: completed,
      }),
    ).toBe('completed');
  });

  it.each([null, '', '   '])('shows a finite error for completed result %s', (result) => {
    expect(
      getAnalysisDetailPresentationState({
        reportId: 42,
        isLoading: false,
        isError: false,
        detail: { ...completed, result },
      }),
    ).toBe('loadError');
  });

  it('reserves the processing state for PENDING', () => {
    expect(
      getAnalysisDetailPresentationState({
        reportId: 42,
        isLoading: false,
        isError: false,
        detail: { ...completed, status: 'PENDING', result: null },
      }),
    ).toBe('pending');
  });

  it('shows failed reports as failed', () => {
    expect(
      getAnalysisDetailPresentationState({
        reportId: 42,
        isLoading: false,
        isError: false,
        detail: { ...completed, status: 'FAILED', result: null },
      }),
    ).toBe('failed');
  });

  it('shows invalid ids and request failures as load errors', () => {
    expect(
      getAnalysisDetailPresentationState({
        reportId: null,
        isLoading: false,
        isError: false,
      }),
    ).toBe('loadError');
    expect(
      getAnalysisDetailPresentationState({
        reportId: 42,
        isLoading: false,
        isError: true,
      }),
    ).toBe('loadError');
  });
});
