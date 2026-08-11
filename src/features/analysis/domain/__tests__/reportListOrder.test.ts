import { orderAnalysisReports } from '../reportListOrder';
import type { AnalysisHistoryItemDto } from '../../types/api';

function report(
  id: number,
  status: AnalysisHistoryItemDto['status'],
  createdAt: string,
): AnalysisHistoryItemDto {
  return { id, type: 'THINKING_PATTERN', status, createdAt, answerCount: 12 };
}

describe('orderAnalysisReports', () => {
  it('진행 중 리포트를 완료 리포트보다 먼저 둔다', () => {
    const ready = report(1, 'READY', '2026-08-10T00:00:00.000Z');
    const pending = report(2, 'PENDING', '2026-08-01T00:00:00.000Z');
    expect(orderAnalysisReports([ready, pending]).map((item) => item.id)).toEqual([2, 1]);
  });

  it('같은 상태 그룹은 최신 생성순이고 입력을 변경하지 않는다', () => {
    const input = [
      report(1, 'READY', '2026-08-01T00:00:00.000Z'),
      report(2, 'READY', '2026-08-10T00:00:00.000Z'),
    ];
    expect(orderAnalysisReports(input).map((item) => item.id)).toEqual([2, 1]);
    expect(input.map((item) => item.id)).toEqual([1, 2]);
  });
});
