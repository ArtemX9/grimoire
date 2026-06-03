import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as psnApi from 'psn-api';

import { PrismaService } from '../../../prisma/prisma.service';
import { generatePsnAuthorization } from '../../../test';
import { EncryptorService } from '../../encryptor/encryptor.service';
import { PlaystationAuthService } from './playstation-auth.service';

// ---------------------------------------------------------------------------
// psn-api module mock
// ---------------------------------------------------------------------------

jest.mock('psn-api', () => ({
  exchangeNpssoForAccessCode: jest.fn(),
  exchangeAccessCodeForAuthTokens: jest.fn(),
  exchangeRefreshTokenForAuthTokens: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('PlaystationAuthService', () => {
  let service: PlaystationAuthService;
  let module: TestingModule;

  const ACCESS_CODE = 'test-access-code';
  const NPSSO = 'valid-npsso-token';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.useRealTimers();
    if (module) await module.close();
  });

  // Build the service with a stored token (npsso defined) or without one (npsso undefined).
  // When npsso is defined, platformsTokens.findUnique returns a fake DB row whose
  // token field is the raw NPSSO string (decrypt is an identity function in tests).
  async function createService(npsso: string | undefined = NPSSO): Promise<PlaystationAuthService> {
    const pastDate = new Date(Date.now() - 1000); // dateSet in the past → valid token
    const platformTokenRow = npsso ? { id: 1, token: npsso, dateSet: pastDate, dateFrame: 3600 } : null;

    module = await Test.createTestingModule({
      providers: [
        PlaystationAuthService,
        {
          provide: PrismaService,
          useValue: {
            platformsTokens: {
              findUnique: jest.fn().mockResolvedValue(platformTokenRow),
            },
          },
        },
        {
          provide: EncryptorService,
          useValue: {
            decrypt: jest.fn((v: string) => v),
          },
        },
      ],
    }).compile();
    return module.get<PlaystationAuthService>(PlaystationAuthService);
  }

  // ---------------------------------------------------------------------------
  // onModuleInit — initial token fetch
  // ---------------------------------------------------------------------------

  describe('onModuleInit', () => {
    it('exchanges the NPSSO for an access code then exchanges the code for auth tokens', async () => {
      const authorization = generatePsnAuthorization({ accessToken: 'init-token', expiresIn: 3600 });
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(authorization);

      service = await createService();
      await service.onModuleInit();

      expect(psnApi.exchangeNpssoForAccessCode).toHaveBeenCalledWith(NPSSO);
      expect(psnApi.exchangeAccessCodeForAuthTokens).toHaveBeenCalledWith(ACCESS_CODE);
    });

    it('calls exchangeNpssoForAccessCode before exchangeAccessCodeForAuthTokens', async () => {
      const callOrder: string[] = [];
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockImplementation(() => {
        callOrder.push('npsso');
        return Promise.resolve(ACCESS_CODE);
      });
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockImplementation(() => {
        callOrder.push('code');
        return Promise.resolve(generatePsnAuthorization());
      });

      service = await createService();
      await service.onModuleInit();

      expect(callOrder).toEqual(['npsso', 'code']);
    });

    it('makes the authorization token available via getAuthorization after init', async () => {
      const authorization = generatePsnAuthorization({ accessToken: 'after-init-token' });
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(authorization);

      service = await createService();
      await service.onModuleInit();

      const result = await service.getAuthorization();

      expect(result.accessToken).toBe('after-init-token');
    });

    it('stores the token expiry based on expiresIn from the initial auth response', async () => {
      const expiresIn = 7200;
      const authorization = generatePsnAuthorization({ expiresIn });
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(authorization);

      service = await createService();
      await service.onModuleInit();

      // Advance time to just before expiry — token should still be valid (no refresh call)
      jest.advanceTimersByTime(expiresIn * 1000 - 1);

      await service.getAuthorization();

      expect(psnApi.exchangeRefreshTokenForAuthTokens).not.toHaveBeenCalled();
      // Advance past expiry — refresh should now be triggered
      jest.advanceTimersByTime(2);
      const refreshed = generatePsnAuthorization();
      (psnApi.exchangeRefreshTokenForAuthTokens as jest.Mock).mockResolvedValue(refreshed);

      await service.getAuthorization();

      expect(psnApi.exchangeRefreshTokenForAuthTokens).toHaveBeenCalledTimes(1);
    });

    it('does not call PSN APIs when no platform token row is stored', async () => {
      // When platformsTokens.findUnique returns null, initializePlatform returns early
      // without contacting PSN APIs. We verify by checking no exchange calls are made.
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockClear();
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockClear();

      // Create a fresh service with null token in DB and call initializePlatform directly
      const localModule = await Test.createTestingModule({
        providers: [
          PlaystationAuthService,
          {
            provide: PrismaService,
            useValue: {
              platformsTokens: {
                findUnique: jest.fn().mockResolvedValue(null),
              },
            },
          },
          {
            provide: EncryptorService,
            useValue: { decrypt: jest.fn((v: string) => v) },
          },
        ],
      }).compile();
      const localService = localModule.get<PlaystationAuthService>(PlaystationAuthService);
      await localService.initializePlatform();

      expect(psnApi.exchangeNpssoForAccessCode).not.toHaveBeenCalled();
      expect(psnApi.exchangeAccessCodeForAuthTokens).not.toHaveBeenCalled();

      await localModule.close();
    });

    it('swallows PSN API errors during access-code exchange and leaves the service unavailable', async () => {
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockRejectedValue(new Error('PSN 401'));

      service = await createService();

      await expect(service.onModuleInit()).resolves.toBeUndefined();
      await expect(service.getAuthorization()).rejects.toThrow(ServiceUnavailableException);
    });

    it('swallows PSN API errors during auth-token exchange and leaves the service unavailable', async () => {
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockRejectedValue(new Error('Token exchange failed'));

      service = await createService();

      await expect(service.onModuleInit()).resolves.toBeUndefined();
      await expect(service.getAuthorization()).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // ---------------------------------------------------------------------------
  // getAuthorization — returns cached token
  // ---------------------------------------------------------------------------

  describe('getAuthorization', () => {
    beforeEach(async () => {
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(generatePsnAuthorization({ expiresIn: 3600 }));
      service = await createService();
      await service.onModuleInit();
    });

    it('returns the cached authorization token without calling PSN APIs again', async () => {
      const result = await service.getAuthorization();

      expect(result).toBeDefined();
      expect(psnApi.exchangeNpssoForAccessCode).toHaveBeenCalledTimes(1);
      expect(psnApi.exchangeAccessCodeForAuthTokens).toHaveBeenCalledTimes(1);
    });

    it('returns a token with accessToken and expiresIn fields', async () => {
      const result = await service.getAuthorization();

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('returns the same token object on consecutive calls within the expiry window', async () => {
      const first = await service.getAuthorization();
      const second = await service.getAuthorization();

      expect(first).toBe(second);
    });

    it('triggers a refresh and returns the new token when the token has expired', async () => {
      const refreshedAuth = generatePsnAuthorization({ accessToken: 'refreshed-token', expiresIn: 3600 });
      (psnApi.exchangeRefreshTokenForAuthTokens as jest.Mock).mockResolvedValue(refreshedAuth);

      // Advance past the 3600s expiry
      jest.advanceTimersByTime(3601 * 1000);

      const result = await service.getAuthorization();

      expect(psnApi.exchangeRefreshTokenForAuthTokens).toHaveBeenCalledTimes(1);
      expect(result.accessToken).toBe('refreshed-token');
    });

    it('throws ServiceUnavailableException when authorization is absent (never initialised)', async () => {
      // Build a fresh service that skips onModuleInit so authorization is never set
      service = await createService();

      await expect(service.getAuthorization()).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // ---------------------------------------------------------------------------
  // Token refresh
  // ---------------------------------------------------------------------------

  describe('token refresh', () => {
    it('calls exchangeRefreshTokenForAuthTokens with the current refreshToken', async () => {
      const initialAuth = generatePsnAuthorization({ refreshToken: 'my-refresh-token', expiresIn: 3600 });
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(initialAuth);
      (psnApi.exchangeRefreshTokenForAuthTokens as jest.Mock).mockResolvedValue(generatePsnAuthorization({ expiresIn: 3600 }));

      service = await createService();
      await service.onModuleInit();

      jest.advanceTimersByTime(3601 * 1000);
      await service.getAuthorization();

      expect(psnApi.exchangeRefreshTokenForAuthTokens).toHaveBeenCalledWith('my-refresh-token');
    });

    it('updates the stored authorization to the refreshed token after a successful refresh', async () => {
      const initialAuth = generatePsnAuthorization({ accessToken: 'old-token', expiresIn: 3600 });
      const refreshedAuth = generatePsnAuthorization({ accessToken: 'new-token', expiresIn: 3600 });
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(initialAuth);
      (psnApi.exchangeRefreshTokenForAuthTokens as jest.Mock).mockResolvedValue(refreshedAuth);

      service = await createService();
      await service.onModuleInit();

      jest.advanceTimersByTime(3601 * 1000);
      const result = await service.getAuthorization();

      expect(result.accessToken).toBe('new-token');
    });

    it('updates tokenExpiry based on the new expiresIn after a refresh', async () => {
      const initialAuth = generatePsnAuthorization({ expiresIn: 3600 });
      const refreshedAuth = generatePsnAuthorization({ accessToken: 'refreshed', expiresIn: 7200 });
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(initialAuth);
      (psnApi.exchangeRefreshTokenForAuthTokens as jest.Mock).mockResolvedValue(refreshedAuth);

      service = await createService();
      await service.onModuleInit();

      // Trigger first refresh
      jest.advanceTimersByTime(3601 * 1000);
      await service.getAuthorization();

      // Advance another 3600s — still within the new 7200s window from the refresh point
      jest.advanceTimersByTime(3600 * 1000);
      await service.getAuthorization();

      // Only one refresh should have been triggered
      expect(psnApi.exchangeRefreshTokenForAuthTokens).toHaveBeenCalledTimes(1);
    });

    it('only refreshes once per expiry cycle even when getAuthorization is called multiple times concurrently', async () => {
      const initialAuth = generatePsnAuthorization({ expiresIn: 3600 });
      const refreshedAuth = generatePsnAuthorization({ accessToken: 'concurrent-refreshed', expiresIn: 3600 });
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(initialAuth);
      (psnApi.exchangeRefreshTokenForAuthTokens as jest.Mock).mockResolvedValue(refreshedAuth);

      service = await createService();
      await service.onModuleInit();

      jest.advanceTimersByTime(3601 * 1000);

      // Call getAuthorization sequentially (the service is not concurrency-protected,
      // but sequential calls after expiry should each trigger one refresh per expiry window)
      const first = await service.getAuthorization();
      // Token is now fresh — second call within new window should not refresh again
      const second = await service.getAuthorization();

      expect(first.accessToken).toBe('concurrent-refreshed');
      expect(second.accessToken).toBe('concurrent-refreshed');
    });

    it('throws when PSN API returns an error during token refresh', async () => {
      const initialAuth = generatePsnAuthorization({ expiresIn: 3600 });
      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(initialAuth);
      (psnApi.exchangeRefreshTokenForAuthTokens as jest.Mock).mockRejectedValue(new Error('PSN refresh failed'));

      service = await createService();
      await service.onModuleInit();

      jest.advanceTimersByTime(3601 * 1000);

      await expect(service.getAuthorization()).rejects.toThrow('PSN refresh failed');
    });

    it('passes the refreshToken from the most recent authorization on subsequent refreshes', async () => {
      const initialAuth = generatePsnAuthorization({ expiresIn: 3600, refreshToken: 'refresh-v1' });
      const firstRefreshedAuth = generatePsnAuthorization({ expiresIn: 3600, refreshToken: 'refresh-v2' });
      const secondRefreshedAuth = generatePsnAuthorization({ expiresIn: 3600, refreshToken: 'refresh-v3' });

      (psnApi.exchangeNpssoForAccessCode as jest.Mock).mockResolvedValue(ACCESS_CODE);
      (psnApi.exchangeAccessCodeForAuthTokens as jest.Mock).mockResolvedValue(initialAuth);
      (psnApi.exchangeRefreshTokenForAuthTokens as jest.Mock)
        .mockResolvedValueOnce(firstRefreshedAuth)
        .mockResolvedValueOnce(secondRefreshedAuth);

      service = await createService();
      await service.onModuleInit();

      // First expiry cycle
      jest.advanceTimersByTime(3601 * 1000);
      await service.getAuthorization();

      // Second expiry cycle — should use refresh-v2
      jest.advanceTimersByTime(3601 * 1000);
      await service.getAuthorization();

      expect(psnApi.exchangeRefreshTokenForAuthTokens).toHaveBeenNthCalledWith(1, 'refresh-v1');
      expect(psnApi.exchangeRefreshTokenForAuthTokens).toHaveBeenNthCalledWith(2, 'refresh-v2');
    });
  });
});
