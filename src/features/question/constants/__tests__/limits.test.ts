import { MemberPermission } from '@/shared/types/member';
import {
  getMaxReloadCount,
  canReloadQuestion,
  getReloadCountDisplay,
} from '../limits';

describe('getMaxReloadCount', () => {
  it('FREE는 2회', () => {
    expect(getMaxReloadCount(MemberPermission.FREE)).toBe(2);
  });

  it('PREMIUM은 4회', () => {
    expect(getMaxReloadCount(MemberPermission.PREMIUM)).toBe(4);
  });
});

describe('canReloadQuestion', () => {
  it('사용 횟수가 max 미만이면 true', () => {
    expect(canReloadQuestion(0, MemberPermission.FREE)).toBe(true);
    expect(canReloadQuestion(1, MemberPermission.FREE)).toBe(true);
  });

  it('사용 횟수가 max 이상이면 false', () => {
    expect(canReloadQuestion(2, MemberPermission.FREE)).toBe(false);
    expect(canReloadQuestion(3, MemberPermission.FREE)).toBe(false);
  });

  it('PREMIUM은 4회까지 가능', () => {
    expect(canReloadQuestion(3, MemberPermission.PREMIUM)).toBe(true);
    expect(canReloadQuestion(4, MemberPermission.PREMIUM)).toBe(false);
  });
});

describe('getReloadCountDisplay', () => {
  it('FREE 0회 사용 → 2/2 남음', () => {
    expect(getReloadCountDisplay(0, MemberPermission.FREE)).toEqual({
      remaining: 2,
      max: 2,
    });
  });

  it('FREE 1회 사용 → 1/2 남음', () => {
    expect(getReloadCountDisplay(1, MemberPermission.FREE)).toEqual({
      remaining: 1,
      max: 2,
    });
  });

  it('PREMIUM 1회 사용 → 3/4 남음', () => {
    expect(getReloadCountDisplay(1, MemberPermission.PREMIUM)).toEqual({
      remaining: 3,
      max: 4,
    });
  });

  it('max 초과 사용해도 remaining은 0 (음수 아님)', () => {
    expect(getReloadCountDisplay(5, MemberPermission.FREE)).toEqual({
      remaining: 0,
      max: 2,
    });
  });
});
