import { getQueueToken } from '@nestjs/bullmq';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as XSAPIClientModule from '@xboxreplay/xboxlive-auth';

import { Platform, PlatformSyncStatus } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { PLATFORM_ID_XBOX, XBOX_QUEUE_TITLE } from './constants';
import { XboxAuthService } from './xbox-auth.service';
import { XboxGame } from './types';
import { XboxService } from './xbox.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlatformRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'plat-xbox-1',
    userId: 'user-1',
    platformId: PLATFORM_ID_XBOX,
    externalId: 'XboxGamertag',
    accessToken: null,
    refreshToken: null,
    lastSyncAt: null,
    isSyncing: false,
    platform: { id: PLATFORM_ID_XBOX, platform: Platform.Xbox },
    ...overrides,
  };
}

function makeTokenInfo() {
  return {
    xboxUserID: 'xbox-xuid-123',
    token: 'xsts-token-abc',
    userHash: 'user-hash-xyz',
  };
}

function makeXboxGame(overrides: Partial<XboxGame> = {}): XboxGame {
  return {
    titleId: 'title-1',
    modernTitleId: 'modern-title-1',
    name: 'Halo Infinite',
    displayImage: 'https://example.com/halo.jpg',
    pfn: null,
    bingId: null,
    windowsPhoneProductId: null,
    type: 0 as unknown as import('./types').XboxGameType,
    devices: [],
    mediaItemType: 0 as unknown as import('./types').MediaItemType,
    isBundle: false,
    achievement: {
      currentAchievements: 10,
      totalAchievements: 100,
      currentGamerscore: 200,
      totalGamerscore: 2000,
      progressPercentage: 10,
      sourceVersion: 1,
    },
    stats: null,
    gamePass: null,
    images: [],
    titleHistory: { lastTimePlayed: new Date(), visible: true, canHide: false },
    titleRecord: null,
    detail: null,
    friendsWhoPlayed: null,
    alternateTitleIds: null,
    contentBoards: null,
    xboxLiveTier: 0 as unknown as import('./types').XboxLiveTier,
    ...overrides,
  } as XboxGame;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

jest.mock('@xboxreplay/xboxlive-auth', () => ({
  XSAPIClient: {
    get: jest.fn(),
  },
  live: {},
  xnet: {},
}));

describe('XboxService', () => {
  let service: XboxService;
  let prisma: jest.Mocked<PrismaService>;
  let xboxAuth: { getValidToken: jest.Mock };
  let xboxQueue: { add: jest.Mock };

  beforeEach(async () => {
    xboxAuth = { getValidToken: jest.fn().mockResolvedValue(makeTokenInfo()) };
    xboxQueue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XboxService,
        { provide: XboxAuthService, useValue: xboxAuth },
        {
          provide: PrismaService,
          useValue: {
            userPlatform: {
              upsert: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: getQueueToken(XBOX_QUEUE_TITLE),
          useValue: xboxQueue,
        },
      ],
    }).compile();

    service = module.get<XboxService>(XboxService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
    xboxAuth.getValidToken.mockResolvedValue(makeTokenInfo());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // connect
  // ---------------------------------------------------------------------------

  describe('connect', () => {
    it('upserts the platform record using the xboxUserID from the token and returns a mapped response', async () => {
      const platformRow = makePlatformRow({ externalId: 'xbox-xuid-123' });
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(platformRow);

      const result = await service.connect('user-1');

      expect(prisma.userPlatform.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_platformId: { userId: 'user-1', platformId: PLATFORM_ID_XBOX } },
          update: { externalId: 'xbox-xuid-123' },
          create: expect.objectContaining({ userId: 'user-1', platformId: PLATFORM_ID_XBOX, externalId: 'xbox-xuid-123' }),
        }),
      );
      expect(result.id).toBe('plat-xbox-1');
      expect(result.externalId).toBe('xbox-xuid-123');
    });

    it('obtains a valid token before upserting', async () => {
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(makePlatformRow());

      await service.connect('user-1');

      expect(xboxAuth.getValidToken).toHaveBeenCalledWith('user-1');
    });

    it('does not expose accessToken or refreshToken in the response', async () => {
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(
        makePlatformRow({ accessToken: 'secret', refreshToken: 'also-secret' }),
      );

      const result = await service.connect('user-1');

      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('maps a null lastSyncAt to undefined in the response', async () => {
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(makePlatformRow({ lastSyncAt: null }));

      const result = await service.connect('user-1');

      expect(result.lastSyncAt).toBeUndefined();
    });

    it('includes lastSyncAt in the response when it is set', async () => {
      const syncDate = new Date('2024-05-20T10:00:00Z');
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(makePlatformRow({ lastSyncAt: syncDate }));

      const result = await service.connect('user-1');

      expect(result.lastSyncAt).toEqual(syncDate);
    });
  });

  // ---------------------------------------------------------------------------
  // getSyncStatus
  // ---------------------------------------------------------------------------

  describe('getSyncStatus', () => {
    it('returns { connected: true } with lastSyncAt when the platform record exists', async () => {
      const syncDate = new Date('2024-03-10T08:00:00Z');
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow({ lastSyncAt: syncDate }));

      const result: PlatformSyncStatus = await service.getSyncStatus('user-1');

      expect(result.connected).toBe(true);
      expect(result.lastSyncAt).toEqual(syncDate);
    });

    it('returns { connected: false } when no platform record exists', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getSyncStatus('user-1');

      expect(result.connected).toBe(false);
      expect(result.lastSyncAt).toBeUndefined();
    });

    it('returns lastSyncAt as undefined when platform exists but has never synced', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow({ lastSyncAt: null }));

      const result = await service.getSyncStatus('user-1');

      expect(result.connected).toBe(true);
      expect(result.lastSyncAt).toBeUndefined();
    });

    it('scopes the lookup to the requesting user with the correct compound key', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      await service.getSyncStatus('user-42');

      expect(prisma.userPlatform.findUnique).toHaveBeenCalledWith({
        where: { userId_platformId: { userId: 'user-42', platformId: PLATFORM_ID_XBOX } },
      });
    });

    it('returns the externalID when the platform record exists', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow({ externalId: 'MyGamertag' }));

      const result = await service.getSyncStatus('user-1');

      expect(result.externalID).toBe('MyGamertag');
    });
  });

  // ---------------------------------------------------------------------------
  // enqueueSync
  // ---------------------------------------------------------------------------

  describe('enqueueSync', () => {
    it('adds a sync job to the queue and returns { queued: true } when Xbox is connected', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow({ externalId: 'XboxGamertag' }));
      xboxQueue.add.mockResolvedValue({});

      const result = await service.enqueueSync('user-1');

      expect(xboxQueue.add).toHaveBeenCalledWith(
        'sync',
        { userID: 'user-1', xboxAccountID: 'XboxGamertag' },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
      expect(result).toEqual({ queued: true });
    });

    it('returns { queued: false } with a reason when Xbox is not connected', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.enqueueSync('user-1');

      expect(xboxQueue.add).not.toHaveBeenCalled();
      expect(result.queued).toBe(false);
      expect((result as { queued: boolean; reason?: string }).reason).toBeDefined();
    });

    it('looks up the platform using the correct userId_platformId compound key', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      await service.enqueueSync('user-77');

      expect(prisma.userPlatform.findUnique).toHaveBeenCalledWith({
        where: { userId_platformId: { userId: 'user-77', platformId: PLATFORM_ID_XBOX } },
      });
    });

    it('enqueues with retry attempts and exponential backoff configured', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow());
      xboxQueue.add.mockResolvedValue({});

      await service.enqueueSync('user-1');

      const opts = xboxQueue.add.mock.calls[0][2];
      expect(opts.attempts).toBe(3);
      expect(opts.backoff.type).toBe('exponential');
    });

    it('passes the stored externalId as xboxAccountID in the job payload', async () => {
      const gamertag = 'SuperGamer99';
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow({ externalId: gamertag }));
      xboxQueue.add.mockResolvedValue({});

      await service.enqueueSync('user-1');

      const payload = xboxQueue.add.mock.calls[0][1];
      expect(payload.xboxAccountID).toBe(gamertag);
    });

    it('returns { queued: false } when the queue add call throws', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow());
      xboxQueue.add.mockRejectedValue(new Error('Redis connection refused'));

      const result = await service.enqueueSync('user-1');

      expect(result.queued).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getOwnedGames
  // ---------------------------------------------------------------------------

  describe('getOwnedGames', () => {
    it('returns the titles array from the titlehub API response', async () => {
      const games = [makeXboxGame(), makeXboxGame({ titleId: 'title-2', name: 'Forza Horizon 5' })];
      (XSAPIClientModule.XSAPIClient.get as jest.Mock).mockResolvedValue({ data: { titles: games } });

      const result = await service.getOwnedGames('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Halo Infinite');
    });

    it('passes the correct XSTS token options to XSAPIClient.get', async () => {
      (XSAPIClientModule.XSAPIClient.get as jest.Mock).mockResolvedValue({ data: { titles: [] } });

      await service.getOwnedGames('user-1');

      const [, callOptions] = (XSAPIClientModule.XSAPIClient.get as jest.Mock).mock.calls[0];
      expect(callOptions.options).toEqual(
        expect.objectContaining({
          XSTSToken: 'xsts-token-abc',
          userHash: 'user-hash-xyz',
        }),
      );
    });

    it('calls the titlehub endpoint with the correct xuid', async () => {
      (XSAPIClientModule.XSAPIClient.get as jest.Mock).mockResolvedValue({ data: { titles: [] } });

      await service.getOwnedGames('user-1');

      const [url] = (XSAPIClientModule.XSAPIClient.get as jest.Mock).mock.calls[0];
      expect(url).toContain('xuid(xbox-xuid-123)');
    });

    it('returns an empty array when the API response has no titles', () => {
      (XSAPIClientModule.XSAPIClient.get as jest.Mock).mockResolvedValue({ data: {} });
      return expect(service.getOwnedGames('user-1')).resolves.toEqual([]);
    });

    it('throws UnprocessableEntityException when the API call fails', async () => {
      (XSAPIClientModule.XSAPIClient.get as jest.Mock).mockRejectedValue(new Error('Xbox API error'));

      await expect(service.getOwnedGames('user-1')).rejects.toThrow(UnprocessableEntityException);
    });

    it('obtains a valid token before calling the Xbox API', async () => {
      (XSAPIClientModule.XSAPIClient.get as jest.Mock).mockResolvedValue({ data: { titles: [] } });

      await service.getOwnedGames('user-1');

      expect(xboxAuth.getValidToken).toHaveBeenCalledWith('user-1');
    });
  });
});
