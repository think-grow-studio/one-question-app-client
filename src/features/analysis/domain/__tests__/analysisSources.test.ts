import { sortAnalysisSourcesNewestFirst } from '../analysisSources';
import type { AnalysisReportSourceDto } from '../../types/api';

const SOURCES: AnalysisReportSourceDto[] = [
  {
    questionDate: '2026-08-01',
    questionContent: '첫 번째 질문',
    answerContent: '첫 번째 답변',
  },
  {
    questionDate: '2026-08-13',
    questionContent: '두 번째 질문',
    answerContent: '두 번째 답변',
  },
  {
    questionDate: '2026-08-07',
    questionContent: '세 번째 질문',
    answerContent: '세 번째 답변',
  },
];

describe('sortAnalysisSourcesNewestFirst', () => {
  it('returns source snapshots newest first without mutating the API response', () => {
    const result = sortAnalysisSourcesNewestFirst(SOURCES);

    expect(result.map((source) => source.questionDate)).toEqual([
      '2026-08-13',
      '2026-08-07',
      '2026-08-01',
    ]);
    expect(SOURCES.map((source) => source.questionDate)).toEqual([
      '2026-08-01',
      '2026-08-13',
      '2026-08-07',
    ]);
  });
});
