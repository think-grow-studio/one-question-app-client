import { compareVersions, meetsMinVersion, hasNewerVersion } from '../versionComparator';

describe('compareVersions', () => {
  it('같은 버전이면 0', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });

  it('첫 번째가 더 크면 1', () => {
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
  });

  it('첫 번째가 더 작으면 -1', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
  });

  it('자릿수가 다른 버전 비교', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.0.0.1')).toBe(-1);
  });
});

describe('meetsMinVersion', () => {
  it('현재 버전이 최소 버전 이상이면 true', () => {
    expect(meetsMinVersion('1.0.1', '1.0.0')).toBe(true);
    expect(meetsMinVersion('1.0.0', '1.0.0')).toBe(true);
  });

  it('현재 버전이 최소 버전 미만이면 false', () => {
    expect(meetsMinVersion('1.0.0', '1.0.1')).toBe(false);
  });
});

describe('hasNewerVersion', () => {
  it('최신 버전이 더 높으면 true', () => {
    expect(hasNewerVersion('1.0.0', '1.0.1')).toBe(true);
  });

  it('같거나 현재가 더 높으면 false', () => {
    expect(hasNewerVersion('1.0.1', '1.0.1')).toBe(false);
    expect(hasNewerVersion('1.0.2', '1.0.1')).toBe(false);
  });
});
