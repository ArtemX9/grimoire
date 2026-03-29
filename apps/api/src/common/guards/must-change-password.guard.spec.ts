import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SKIP_MUST_CHANGE_PASSWORD } from '../decorators/skip-must-change-password.decorator';
import { MustChangePasswordGuard } from './must-change-password.guard';

function makeContext(user: unknown, skipMetadata = false): ExecutionContext {
  const handler = () => {};
  const controller = class {};
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    // skipMetadata attached to the handler via Reflector — mocked at the Reflector level
  } as unknown as ExecutionContext;
}

describe('MustChangePasswordGuard', () => {
  let guard: MustChangePasswordGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new MustChangePasswordGuard(reflector);
  });

  it('passes when SkipMustChangePassword decorator is present', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = makeContext({ id: 'user-1', mustChangePassword: true });
    expect(guard.canActivate(ctx)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(SKIP_MUST_CHANGE_PASSWORD, expect.any(Array));
  });

  it('passes when user is not authenticated (let AuthGuard handle it)', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeContext(undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException with MUST_CHANGE_PASSWORD code when mustChangePassword=true', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeContext({ id: 'user-1', mustChangePassword: true });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);

    try {
      guard.canActivate(ctx);
    } catch (err) {
      expect((err as ForbiddenException).getResponse()).toMatchObject({
        message: 'Password change required',
        code: 'MUST_CHANGE_PASSWORD',
      });
    }
  });

  it('passes when mustChangePassword=false', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeContext({ id: 'user-1', mustChangePassword: false });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('passes when mustChangePassword is absent on the user object', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeContext({ id: 'user-1' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
