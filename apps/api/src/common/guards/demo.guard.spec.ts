import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { DemoGuard } from './demo.guard';

function makeContext(user: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('DemoGuard', () => {
  let guard: DemoGuard;

  beforeEach(() => {
    guard = new DemoGuard();
  });

  it('returns true for a regular (non-demo) user', () => {
    const ctx = makeContext({ id: 'user-1', isDemo: false });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException for a demo user', () => {
    const ctx = makeContext({ id: 'demo-1', isDemo: true });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('includes the expected message in the thrown exception', () => {
    const ctx = makeContext({ id: 'demo-1', isDemo: true });

    expect(() => guard.canActivate(ctx)).toThrow('Platform sync is disabled for demo accounts');
  });
});
