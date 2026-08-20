import {
  decideReconcileAction,
  needsSdkToken,
  type NotificationIntent,
  type ReconcileInput,
} from '../reconcileDecision';

const SDK = 'sdk-token-new';
const STORED = 'stored-token-old';

const both: NotificationIntent = { reminder: true, report: true };
const reminderOnly: NotificationIntent = { reminder: true, report: false };
const reportOnly: NotificationIntent = { reminder: false, report: true };
const neither: NotificationIntent = { reminder: false, report: false };

function input(overrides: Partial<ReconcileInput> = {}): ReconcileInput {
  return {
    permissionGranted: true,
    storedToken: null,
    intent: both,
    sdkToken: SDK,
    ...overrides,
  };
}

describe('decideReconcileAction', () => {
  describe('OS 권한이 없을 때 — 전송 경로를 끊는다', () => {
    it('기억하고 있는 토큰이 있으면 삭제한다', () => {
      expect(
        decideReconcileAction(input({ permissionGranted: false, storedToken: STORED }))
      ).toEqual({ type: 'delete', token: STORED });
    });

    it('기억하는 토큰이 없으면 할 일이 없다', () => {
      expect(
        decideReconcileAction(input({ permissionGranted: false, storedToken: null }))
      ).toEqual({ type: 'none', reason: 'no-token-to-delete' });
    });

    it('카테고리가 모두 켜져 있어도 권한이 우선한다', () => {
      expect(
        decideReconcileAction(
          input({ permissionGranted: false, storedToken: STORED, intent: both })
        )
      ).toEqual({ type: 'delete', token: STORED });
    });

    it('설정을 바꾸지 않는다 — 반환값은 토큰 조작뿐이다', () => {
      const action = decideReconcileAction(
        input({ permissionGranted: false, storedToken: STORED })
      );
      // 'delete' | 'register' | 'none' 외의 지시가 생기면 의사(intent)를 덮어쓰는
      // 회귀일 수 있다. 권한 상태를 설정값에 쓰던 예전 구조로 돌아가지 않도록 고정한다.
      expect(['delete', 'register', 'none']).toContain(action.type);
    });
  });

  describe('권한은 있고 원하는 카테고리가 없을 때', () => {
    it('새 토큰을 심지 않는다', () => {
      expect(
        decideReconcileAction(input({ intent: neither, storedToken: null }))
      ).toEqual({ type: 'none', reason: 'no-category-wanted' });
    });

    it('이미 등록된 토큰은 지우지 않는다 (재활성화 마찰 최소화)', () => {
      expect(
        decideReconcileAction(input({ intent: neither, storedToken: STORED }))
      ).toEqual({ type: 'none', reason: 'no-category-wanted' });
    });
  });

  describe('권한이 있고 카테고리를 하나라도 원할 때 — 토큰을 일치시킨다', () => {
    it('저장된 토큰이 없으면 등록한다', () => {
      expect(decideReconcileAction(input({ storedToken: null }))).toEqual({
        type: 'register',
        token: SDK,
      });
    });

    it('저장된 토큰과 다르면 재등록한다 (stale token 복구)', () => {
      expect(decideReconcileAction(input({ storedToken: STORED }))).toEqual({
        type: 'register',
        token: SDK,
      });
    });

    it('이미 최신이면 아무것도 하지 않는다', () => {
      expect(decideReconcileAction(input({ storedToken: SDK }))).toEqual({
        type: 'none',
        reason: 'token-already-current',
      });
    });

    it('SDK 토큰을 받지 못했으면 아무것도 하지 않는다', () => {
      expect(decideReconcileAction(input({ sdkToken: null }))).toEqual({
        type: 'none',
        reason: 'sdk-token-unavailable',
      });
    });

    it('리마인드만 켜져 있어도 등록한다', () => {
      expect(
        decideReconcileAction(input({ intent: reminderOnly, storedToken: null }))
      ).toEqual({ type: 'register', token: SDK });
    });

    // 회귀 방지: 예전에는 리마인드(enabled)만으로 게이팅해서, 리마인드를 끄고
    // 리포트만 켠 사용자의 stale token이 영영 복구되지 않았다.
    it('리포트만 켜져 있어도 등록한다', () => {
      expect(
        decideReconcileAction(input({ intent: reportOnly, storedToken: STORED }))
      ).toEqual({ type: 'register', token: SDK });
    });
  });

  describe('멱등성', () => {
    it('등록 직후 같은 입력으로 다시 판단하면 할 일이 없다', () => {
      const first = decideReconcileAction(input({ storedToken: null }));
      expect(first).toEqual({ type: 'register', token: SDK });

      // 등록이 반영된 뒤(store에 SDK 토큰이 기록된 뒤) 재실행
      const second = decideReconcileAction(input({ storedToken: SDK }));
      expect(second).toEqual({ type: 'none', reason: 'token-already-current' });
    });

    it('삭제 직후 같은 입력으로 다시 판단하면 할 일이 없다', () => {
      const first = decideReconcileAction(
        input({ permissionGranted: false, storedToken: STORED })
      );
      expect(first).toEqual({ type: 'delete', token: STORED });

      const second = decideReconcileAction(
        input({ permissionGranted: false, storedToken: null })
      );
      expect(second).toEqual({ type: 'none', reason: 'no-token-to-delete' });
    });
  });

  describe('권한 왕복 — 설정이 살아남아 그대로 복구된다', () => {
    it('권한 OFF로 토큰이 사라져도, 권한이 돌아오면 같은 intent로 재등록된다', () => {
      const intent = reminderOnly; // 사용자가 켜둔 설정

      const off = decideReconcileAction(
        input({ permissionGranted: false, storedToken: STORED, intent })
      );
      expect(off).toEqual({ type: 'delete', token: STORED });

      const backOn = decideReconcileAction(
        input({ permissionGranted: true, storedToken: null, intent })
      );
      expect(backOn).toEqual({ type: 'register', token: SDK });
    });
  });
});

describe('needsSdkToken', () => {
  it('권한이 없으면 조회하지 않는다', () => {
    expect(needsSdkToken(false, both)).toBe(false);
  });

  it('원하는 카테고리가 없으면 조회하지 않는다', () => {
    expect(needsSdkToken(true, neither)).toBe(false);
  });

  it('권한이 있고 카테고리를 하나라도 원하면 조회한다', () => {
    expect(needsSdkToken(true, reminderOnly)).toBe(true);
    expect(needsSdkToken(true, reportOnly)).toBe(true);
    expect(needsSdkToken(true, both)).toBe(true);
  });
});
