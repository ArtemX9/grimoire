import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// better-auth and its prisma adapter ship ESM-only and cannot be parsed by
// Jest's CommonJS transform. Stub them out before any module that imports them
// is evaluated. jest.mock calls are hoisted above imports by Babel/ts-jest.
jest.mock('better-auth', () => ({ betterAuth: jest.fn(() => ({})) }));
jest.mock('better-auth/adapters/prisma', () => ({ prismaAdapter: jest.fn() }));

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthGuard } from './auth.guard';

function makeContext(headers: Record<string, string> = {}): ExecutionContext {
  const handler = () => {};
  const controller = class {};
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ headers, user: undefined }),
    }),
  } as unknown as ExecutionContext;
}

function makeContextWithRequest(req: Record<string, unknown>): ExecutionContext {
  const handler = () => {};
  const controller = class {};
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let authService: { auth: { api: { getSession: jest.Mock } } };
  let usersService: { findById: jest.Mock };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    authService = {
      auth: {
        api: {
          getSession: jest.fn(),
        },
      },
    };

    usersService = {
      findById: jest.fn(),
    };

    guard = new AuthGuard(authService as any, usersService as any, reflector);
  });

  describe('public routes', () => {
    it('returns true immediately when the route is marked @Public (handler metadata)', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(authService.auth.api.getSession).not.toHaveBeenCalled();
      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('checks the correct metadata key and both handler and class targets', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeContext();

      await guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    });
  });

  describe('authenticated routes — success', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(false);
    });

    it('returns true and merges extra user info onto the request when session is valid', async () => {
      const sessionUser = { id: 'user-1', email: 'a@b.com' };
      const extraInfo = { plan: 'FREE', role: 'USER', mustChangePassword: false };
      authService.auth.api.getSession.mockResolvedValue({ user: sessionUser });
      usersService.findById.mockResolvedValue(extraInfo);

      const req: Record<string, unknown> = { headers: { cookie: 'session=abc' } };
      const ctx = makeContextWithRequest(req);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(usersService.findById).toHaveBeenCalledWith(sessionUser.id);
      expect(req['user']).toMatchObject({ ...sessionUser, ...extraInfo });
    });

    it('spreads extra user info over the session user so db fields take precedence', async () => {
      const sessionUser = { id: 'user-1', plan: 'stale-value' };
      const extraInfo = { plan: 'PRO', mustChangePassword: false };
      authService.auth.api.getSession.mockResolvedValue({ user: sessionUser });
      usersService.findById.mockResolvedValue(extraInfo);

      const req: Record<string, unknown> = { headers: {} };
      const ctx = makeContextWithRequest(req);

      await guard.canActivate(ctx);

      expect((req['user'] as Record<string, unknown>)['plan']).toBe('PRO');
    });

    it('passes the raw request headers to getSession', async () => {
      const headers = { cookie: 'better-auth.session_token=xyz' };
      authService.auth.api.getSession.mockResolvedValue({ user: { id: 'u1' } });
      usersService.findById.mockResolvedValue({});

      const req: Record<string, unknown> = { headers };
      const ctx = makeContextWithRequest(req);

      await guard.canActivate(ctx);

      expect(authService.auth.api.getSession).toHaveBeenCalledWith({ headers });
    });
  });

  describe('authenticated routes — no valid session', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(false);
    });

    it('returns false when getSession resolves with null', async () => {
      authService.auth.api.getSession.mockResolvedValue(null);
      const ctx = makeContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(false);
      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('returns false when getSession resolves with an object that has no user', async () => {
      authService.auth.api.getSession.mockResolvedValue({ user: null });
      const ctx = makeContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(false);
      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('returns false when getSession resolves with undefined', async () => {
      authService.auth.api.getSession.mockResolvedValue(undefined);
      const ctx = makeContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(false);
    });

    it('returns false when getSession resolves with an empty object', async () => {
      authService.auth.api.getSession.mockResolvedValue({});
      const ctx = makeContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(false);
    });
  });

  describe('authenticated routes — errors', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(false);
    });

    it('throws UnauthorizedException when getSession rejects', async () => {
      authService.auth.api.getSession.mockRejectedValue(new Error('network failure'));
      const ctx = makeContext();

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when getSession throws synchronously', async () => {
      authService.auth.api.getSession.mockImplementation(() => {
        throw new Error('sync error');
      });
      const ctx = makeContext();

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('wraps the original error inside the UnauthorizedException', async () => {
      const originalError = new Error('token expired');
      authService.auth.api.getSession.mockRejectedValue(originalError);
      const ctx = makeContext();

      try {
        await guard.canActivate(ctx);
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException);
      }
    });

    it('throws UnauthorizedException when usersService.findById rejects', async () => {
      authService.auth.api.getSession.mockResolvedValue({ user: { id: 'user-1' } });
      usersService.findById.mockRejectedValue(new Error('db error'));
      const ctx = makeContext();

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('public flag falsy', () => {
    it('proceeds to session check when reflector returns false', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      authService.auth.api.getSession.mockResolvedValue(null);
      const ctx = makeContext();

      const result = await guard.canActivate(ctx);

      expect(authService.auth.api.getSession).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('proceeds to session check when reflector returns undefined', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      authService.auth.api.getSession.mockResolvedValue(null);
      const ctx = makeContext();

      const result = await guard.canActivate(ctx);

      expect(authService.auth.api.getSession).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
