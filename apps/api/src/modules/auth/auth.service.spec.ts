import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

// better-auth initialises network connections during construction via the
// prismaAdapter.  Mock the entire module so that no real DB or HTTP traffic
// happens when AuthService is instantiated in tests.
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

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { betterAuth } from 'better-auth';
const mockedBetterAuth = betterAuth as jest.MockedFunction<typeof betterAuth>;

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'app.auth.secret': 'test-secret',
        'app.igdb.clientId': 'test-client-id',
        'app.igdb.clientSecret': 'test-client-secret',
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ---------------------------------------------------------------------------
  // Construction — auth object is initialised
  // ---------------------------------------------------------------------------

  describe('constructor', () => {
    it('creates the service and exposes an auth object', () => {
      expect(service).toBeDefined();
      expect(service.auth).toBeDefined();
    });

    it('calls betterAuth with the secret from ConfigService', () => {
      expect(mockedBetterAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          secret: 'test-secret',
        }),
      );
    });

    it('enables emailAndPassword on the better-auth instance', () => {
      expect(mockedBetterAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          emailAndPassword: expect.objectContaining({ enabled: true }),
        }),
      );
    });

    it('wires custom hash and verify functions for password handling', () => {
      const callArg = (mockedBetterAuth as jest.Mock).mock.calls[0][0];
      expect(typeof callArg.emailAndPassword.password.hash).toBe('function');
      expect(typeof callArg.emailAndPassword.password.verify).toBe('function');
    });
  });

  // ---------------------------------------------------------------------------
  // doHashing / doVerify — the private module-level helpers are exercised
  // indirectly through the betterAuth constructor argument.
  // ---------------------------------------------------------------------------

  describe('password helpers (via betterAuth config)', () => {
    it('hash function delegates to bcryptjs.hash with cost 12', async () => {
      const bcryptjs = await import('bcryptjs');
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed-pw');

      const callArg = (mockedBetterAuth as jest.Mock).mock.calls[0][0];
      const result = await callArg.emailAndPassword.password.hash('my-password');

      expect(bcryptjs.hash).toHaveBeenCalledWith('my-password', 12);
      expect(result).toBe('hashed-pw');
    });

    it('verify function delegates to bcryptjs.compare and returns true on match', async () => {
      const bcryptjs = await import('bcryptjs');
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

      const callArg = (mockedBetterAuth as jest.Mock).mock.calls[0][0];
      const result = await callArg.emailAndPassword.password.verify({
        hash: 'stored-hash',
        password: 'plain-text',
      });

      expect(bcryptjs.compare).toHaveBeenCalledWith('plain-text', 'stored-hash');
      expect(result).toBe(true);
    });

    it('verify function returns false when the password does not match', async () => {
      const bcryptjs = await import('bcryptjs');
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      const callArg = (mockedBetterAuth as jest.Mock).mock.calls[0][0];
      const result = await callArg.emailAndPassword.password.verify({
        hash: 'stored-hash',
        password: 'wrong-password',
      });

      expect(result).toBe(false);
    });
  });
});
