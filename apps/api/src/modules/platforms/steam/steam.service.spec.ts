import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { SteamService } from './steam.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlatformRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'plat-1',
    userId: 'user-1',
    platform: Platform.STEAM,
    externalId: '76561198000000001',
    accessToken: null,
    refreshToken: null,
    lastSyncAt: null,
    ...overrides,
  };
}

function makeSteamGame(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    appid: 292030,
    name: 'The Witcher 3: Wild Hunt',
    playtime_forever: 3000,
    img_icon_url: 'icon.jpg',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SteamService', () => {
  let service: SteamService;
  let prisma: jest.Mocked<PrismaService>;
  let steamQueue: { add: jest.Mock };
  let mockFetch: jest.Mock;

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'app.steam.apiKey': 'test-steam-api-key',
      };
      return map[key] ?? null;
    }),
  };

  beforeEach(async () => {
    steamQueue = { add: jest.fn() };
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SteamService,
        { provide: ConfigService, useValue: mockConfig },
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
        // Provide the BullMQ queue token that @InjectQueue('steam-sync') resolves to.
        {
          provide: getQueueToken('steam-sync'),
          useValue: steamQueue,
        },
      ],
    }).compile();

    service = module.get<SteamService>(SteamService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getOwnedGames
  // ---------------------------------------------------------------------------

  describe('getOwnedGames', () => {
    it('returns the games list from the Steam API response', async () => {
      const games = [makeSteamGame(), makeSteamGame({ appid: 570, name: 'Dota 2' })];
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ response: { games } }),
      });

      const result = await service.getOwnedGames('76561198000000001');

      expect(result).toHaveLength(2);
      expect(result[0].appid).toBe(292030);
    });

    it('includes the API key and steamId in the request URL', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ response: { games: [] } }),
      });

      await service.getOwnedGames('76561198000000001');

      const url: string = mockFetch.mock.calls[0][0];
      expect(url).toContain('key=test-steam-api-key');
      expect(url).toContain('steamid=76561198000000001');
    });

    it('returns an empty array when the Steam response contains no games key', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ response: {} }),
      });

      const result = await service.getOwnedGames('76561198000000001');

      expect(result).toEqual([]);
    });

    it('returns an empty array when the Steam response object is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({}),
      });

      const result = await service.getOwnedGames('76561198000000001');

      expect(result).toEqual([]);
    });

    it('requests include_appinfo so that game names are available', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ response: { games: [] } }),
      });

      await service.getOwnedGames('any-id');

      const url: string = mockFetch.mock.calls[0][0];
      expect(url).toContain('include_appinfo=1');
    });
  });

  // ---------------------------------------------------------------------------
  // connectPlatform
  // ---------------------------------------------------------------------------

  describe('connectPlatform', () => {
    it('upserts the platform record and returns a mapped response', async () => {
      const platformRow = makePlatformRow();
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(platformRow);

      const result = await service.connectPlatform('user-1', '76561198000000001');

      expect(prisma.userPlatform.upsert).toHaveBeenCalledWith({
        where: { userId_platform: { userId: 'user-1', platform: Platform.STEAM } },
        update: { externalId: '76561198000000001' },
        create: { userId: 'user-1', platform: Platform.STEAM, externalId: '76561198000000001' },
      });
      expect(result.id).toBe('plat-1');
      expect(result.externalId).toBe('76561198000000001');
    });

    it('does not expose accessToken or refreshToken in the response', async () => {
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(makePlatformRow({ accessToken: 'secret', refreshToken: 'also-secret' }));

      const result = await service.connectPlatform('user-1', 'steam-id');

      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('maps a null lastSyncAt to undefined in the response', async () => {
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(makePlatformRow({ lastSyncAt: null }));

      const result = await service.connectPlatform('user-1', 'steam-id');

      expect(result.lastSyncAt).toBeUndefined();
    });

    it('includes lastSyncAt in the response when it is set', async () => {
      const syncDate = new Date('2024-01-15T12:00:00Z');
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(makePlatformRow({ lastSyncAt: syncDate }));

      const result = await service.connectPlatform('user-1', 'steam-id');

      expect(result.lastSyncAt).toEqual(syncDate);
    });
  });

  // ---------------------------------------------------------------------------
  // enqueueSteamSync
  // ---------------------------------------------------------------------------

  describe('enqueueSteamSync', () => {
    it('adds a sync job to the queue and returns { queued: true } when Steam is connected', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow());
      steamQueue.add.mockResolvedValue({});

      const result = await service.enqueueSteamSync('user-1');

      expect(steamQueue.add).toHaveBeenCalledWith(
        'sync',
        { userId: 'user-1', steamId: '76561198000000001' },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
      expect(result).toEqual({ queued: true });
    });

    it('returns { queued: false } with a reason when Steam is not connected', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.enqueueSteamSync('user-1');

      expect(steamQueue.add).not.toHaveBeenCalled();
      expect(result.queued).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('looks up the platform using the correct userId_platform compound key', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      await service.enqueueSteamSync('user-99');

      expect(prisma.userPlatform.findUnique).toHaveBeenCalledWith({
        where: { userId_platform: { userId: 'user-99', platform: Platform.STEAM } },
      });
    });

    it('enqueues with retry attempts and exponential backoff configured', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow());
      steamQueue.add.mockResolvedValue({});

      await service.enqueueSteamSync('user-1');

      const opts = steamQueue.add.mock.calls[0][2];
      expect(opts.attempts).toBe(3);
      expect(opts.backoff.type).toBe('exponential');
    });

    it('passes the stored externalId as the steamId in the job payload', async () => {
      const customSteamId = '76561190000000099';
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow({ externalId: customSteamId }));
      steamQueue.add.mockResolvedValue({});

      await service.enqueueSteamSync('user-1');

      const payload = steamQueue.add.mock.calls[0][1];
      expect(payload.steamId).toBe(customSteamId);
    });
  });

  // ---------------------------------------------------------------------------
  // getSyncStatus
  // ---------------------------------------------------------------------------

  describe('getSyncStatus', () => {
    it('returns { connected: true } and lastSyncAt when the platform record exists', async () => {
      const syncDate = new Date('2024-03-10T08:00:00Z');
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(makePlatformRow({ lastSyncAt: syncDate }));

      const result = await service.getSyncStatus('user-1');

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

    it('scopes the lookup to the requesting user', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      await service.getSyncStatus('user-42');

      expect(prisma.userPlatform.findUnique).toHaveBeenCalledWith({
        where: { userId_platform: { userId: 'user-42', platform: Platform.STEAM } },
      });
    });
  });
});
