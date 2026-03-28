import { formatLocalDate } from '../date';

describe('formatLocalDate', () => {
  it('Date를 YYYY-MM-DD 형식으로 변환', () => {
    const date = new Date(2025, 0, 15); // 2025-01-15
    expect(formatLocalDate(date)).toBe('2025-01-15');
  });

  it('월/일이 한 자리면 0으로 패딩', () => {
    const date = new Date(2025, 2, 5); // 2025-03-05
    expect(formatLocalDate(date)).toBe('2025-03-05');
  });

  it('12월 처리', () => {
    const date = new Date(2025, 11, 31); // 2025-12-31
    expect(formatLocalDate(date)).toBe('2025-12-31');
  });

  it('인자 없으면 오늘 날짜 반환', () => {
    const result = formatLocalDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
