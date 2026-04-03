// better-auth ships as ESM and would cause a "Cannot use import statement
// outside a module" error when Jest (CJS mode) tries to parse it.  Mock the
// entire package so the import in auth.service.ts resolves to a plain object.
jest.mock('better-auth', () => ({
  betterAuth: jest.fn(() => ({
    api: {
      getSession: jest.fn(),
      signInEmail: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

jest.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: jest.fn(() => ({})),
}));

import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AuthController', () => {
  let controller: AuthController;
  let authApiMock: { getSession: jest.Mock; signInEmail: jest.Mock };
  let usersService: { findById: jest.Mock };

  beforeEach(async () => {
    authApiMock = {
      getSession: jest.fn(),
      signInEmail: jest.fn(),
    };

    usersService = { findById: jest.fn() };

    // AuthService is provided as a value — the actual class (and its
    // better-auth dependency) is never instantiated.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { auth: { api: authApiMock } },
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getSession
  // ---------------------------------------------------------------------------

  describe('getSession', () => {
    it('returns 200 and a merged user when a valid session exists', async () => {
      const fakeUser = { id: 'user-1', email: 'user@example.com' };
      const extraInfo = { plan: 'FREE', role: 'USER', mustChangePassword: false };
      const fakeHeaders = new Map([['set-cookie', 'session=abc']]);

      authApiMock.getSession.mockResolvedValue({
        response: { user: fakeUser, session: { id: 'sess-1' } },
        headers: fakeHeaders,
      });
      usersService.findById.mockResolvedValue(extraInfo);

      const req = { headers: { cookie: 'session=abc' } } as any;
      const res = makeResponse() as any;

      await controller.getSession(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(usersService.findById).toHaveBeenCalledWith('user-1');

      const sentBody = JSON.parse((res.send as jest.Mock).mock.calls[0][0]);
      expect(sentBody.user).toMatchObject({ ...fakeUser, ...extraInfo });
    });

    it('returns 400 and an empty body when no session exists', async () => {
      authApiMock.getSession.mockResolvedValue({
        response: null,
        headers: new Map(),
      });

      const req = { headers: {} } as any;
      const res = makeResponse() as any;

      await controller.getSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('');
    });

    it('throws ForbiddenException when better-auth throws during getSession', async () => {
      authApiMock.getSession.mockRejectedValue(new Error('auth failure'));

      const req = { headers: {} } as any;
      const res = makeResponse() as any;

      await expect(controller.getSession(req, res)).rejects.toThrow(ForbiddenException);
    });

    it('does not call usersService.findById when there is no session', async () => {
      authApiMock.getSession.mockResolvedValue({
        response: null,
        headers: new Map(),
      });

      await controller.getSession({ headers: {} } as any, makeResponse() as any);

      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('forwards response headers from better-auth to the Express response', async () => {
      const fakeHeaders = new Map([
        ['set-cookie', 'session=xyz'],
        ['x-custom', 'value'],
      ]);

      authApiMock.getSession.mockResolvedValue({
        response: { user: { id: 'u1', email: 'u@u.com' }, session: {} },
        headers: fakeHeaders,
      });
      usersService.findById.mockResolvedValue({});

      const req = { headers: {} } as any;
      const res = makeResponse() as any;

      await controller.getSession(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('set-cookie', 'session=xyz');
      expect(res.setHeader).toHaveBeenCalledWith('x-custom', 'value');
    });

    it('merges extra user fields (plan, role, etc.) into the session user object', async () => {
      authApiMock.getSession.mockResolvedValue({
        response: { user: { id: 'u1', email: 'u@u.com' }, session: {} },
        headers: new Map(),
      });
      usersService.findById.mockResolvedValue({ plan: 'PRO', role: 'USER', mustChangePassword: false, aiEnabled: true });

      const req = { headers: {} } as any;
      const res = makeResponse() as any;

      await controller.getSession(req, res);

      const body = JSON.parse((res.send as jest.Mock).mock.calls[0][0]);
      expect(body.user.plan).toBe('PRO');
      expect(body.user.aiEnabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // emailSignIn
  // ---------------------------------------------------------------------------

  describe('emailSignIn', () => {
    it('proxies a successful sign-in response to the client', async () => {
      const fakeUser = { id: 'user-1', email: 'user@example.com' };
      const extraInfo = { role: 'USER', plan: 'FREE', mustChangePassword: false };
      const fakeSignInResponse = {
        status: 200,
        headers: new Map([['set-cookie', 'session=new']]),
        json: jest.fn().mockResolvedValue({ user: fakeUser, token: 'abc' }),
      };

      authApiMock.signInEmail.mockResolvedValue(fakeSignInResponse);
      usersService.findById.mockResolvedValue(extraInfo);

      const req = { body: { email: 'user@example.com', password: 'secret' } } as any;
      const res = makeResponse() as any;

      await controller.emailSignIn(req, res);

      expect(authApiMock.signInEmail).toHaveBeenCalledWith({
        body: { email: 'user@example.com', password: 'secret' },
        asResponse: true,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      const sentBody = JSON.parse((res.send as jest.Mock).mock.calls[0][0]);
      expect(sentBody.user).toMatchObject({ ...fakeUser, ...extraInfo });
    });

    it('proxies a 401 response when credentials are invalid', async () => {
      const fakeSignInResponse = {
        status: 401,
        headers: new Map(),
        text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'Unauthorized' })),
      };

      authApiMock.signInEmail.mockResolvedValue(fakeSignInResponse);

      const req = { body: { email: 'u@u.com', password: 'wrong' } } as any;
      const res = makeResponse() as any;

      await controller.emailSignIn(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('throws ForbiddenException when better-auth throws during sign-in', async () => {
      authApiMock.signInEmail.mockRejectedValue(new Error('network error'));

      const req = { body: { email: 'x@x.com', password: 'pw' } } as any;
      const res = makeResponse() as any;

      await expect(controller.emailSignIn(req, res)).rejects.toThrow(ForbiddenException);
    });

    it('forwards sign-in response headers to the Express response', async () => {
      const fakeSignInResponse = {
        status: 200,
        headers: new Map([['set-cookie', 'session=abc']]),
        json: jest.fn().mockResolvedValue({ user: { id: 'u1', email: 'u@u.com' } }),
      };

      authApiMock.signInEmail.mockResolvedValue(fakeSignInResponse);
      usersService.findById.mockResolvedValue({});

      const req = { body: { email: 'u@u.com', password: 'pw' } } as any;
      const res = makeResponse() as any;

      await controller.emailSignIn(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('set-cookie', 'session=abc');
    });

    it('passes both email and password from the request body to better-auth', async () => {
      authApiMock.signInEmail.mockResolvedValue({
        status: 200,
        headers: new Map(),
        json: jest.fn().mockResolvedValue({ user: { id: 'u1', email: 'admin@company.com' } }),
      });
      usersService.findById.mockResolvedValue({});

      const req = { body: { email: 'admin@company.com', password: 'strongPw!' } } as any;
      const res = makeResponse() as any;

      await controller.emailSignIn(req, res);

      expect(authApiMock.signInEmail).toHaveBeenCalledWith({
        body: { email: 'admin@company.com', password: 'strongPw!' },
        asResponse: true,
      });
    });
  });
});
