import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { AdminGuard } from './admin.guard';

function makeContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  it('allows an ADMIN user through', () => {
    const ctx = makeContext({ id: 'user-1', role: 'ADMIN' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException for a non-admin user', () => {
    const ctx = makeContext({ id: 'user-2', role: 'USER' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is not authenticated (no req.user)', () => {
    const ctx = makeContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when req.user has no role', () => {
    const ctx = makeContext({ id: 'user-3' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
