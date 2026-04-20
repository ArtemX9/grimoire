import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as psnApi from 'psn-api';

import { Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import {
  generateEmptyPsnUniversalSearchResult,
  generatePlaystationPlatformRow,
  generatePsnAuthorization,
  generatePsnUniversalSearchResult,
} from '../../../test';
import { PLATFORM_ID_PLAYSTATION } from './constants';
import { PlaystationAuthService } from './playstation-auth.service';
import { PlaystationService } from './playstation.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_AUTHORIZATION = generatePsnAuthorization({ accessToken: 'test-token', expiresIn: 3600 });

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

jest.mock('psn-api', () => ({
  makeUniversalSearch: jest.fn(),
  getProfileFromUserName: jest.fn(),
  getUserPlayedGames: jest.fn(),
}));

describe('PlaystationService', () => {
  let service: PlaystationService;
  let prisma: jest.Mocked<PrismaService>;
  let playstationAuth: { getAuthorization: jest.Mock };
  let playstationQueue: { add: jest.Mock };

  beforeEach(async () => {
    playstationAuth = { getAuthorization: jest.fn().mockResolvedValue(MOCK_AUTHORIZATION) };
    playstationQueue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaystationService,
        { provide: PlaystationAuthService, useValue: playstationAuth },
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
          provide: getQueueToken('playstation-sync'),
          useValue: playstationQueue,
        },
      ],
    }).compile();

    service = module.get<PlaystationService>(PlaystationService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
    playstationAuth.getAuthorization.mockResolvedValue(MOCK_AUTHORIZATION);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // connect
  // ---------------------------------------------------------------------------

  describe('connect', () => {
    it('resolves accountId from universal search and upserts the platform record', async () => {
      const platformRow = generatePlaystationPlatformRow({ externalId: 'psn-account-123' });
      (psnApi.makeUniversalSearch as jest.Mock).mockResolvedValue(generatePsnUniversalSearchResult({ accountID: 'psn-account-123' }));
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(platformRow);

      const result = await service.connect('user-1', 'TestUser');

      expect(prisma.userPlatform.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_platformId: { userId: 'user-1', platformId: PLATFORM_ID_PLAYSTATION } },
          update: { externalId: 'psn-account-123' },
          create: expect.objectContaining({ userId: 'user-1', platformId: PLATFORM_ID_PLAYSTATION, externalId: 'psn-account-123' }),
        }),
      );
      expect(result.externalId).toBe('psn-account-123');
    });

    it('falls back to getProfileFromUserName when universal search returns no results', async () => {
      const platformRow = generatePlaystationPlatformRow({ externalId: 'fallback-account-id' });
      (psnApi.makeUniversalSearch as jest.Mock).mockResolvedValue(generateEmptyPsnUniversalSearchResult());
      (psnApi.getProfileFromUserName as jest.Mock).mockResolvedValue({ profile: { accountId: 'fallback-account-id' } });
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(platformRow);

      const result = await service.connect('user-1', 'TestUser');

      expect(psnApi.getProfileFromUserName).toHaveBeenCalledWith(MOCK_AUTHORIZATION, 'TestUser');
      expect(result.externalId).toBe('fallback-account-id');
    });

    it('throws NotFoundException when universal search is empty and profile lookup also returns nothing', async () => {
      (psnApi.makeUniversalSearch as jest.Mock).mockResolvedValue(generateEmptyPsnUniversalSearchResult());
      (psnApi.getProfileFromUserName as jest.Mock).mockResolvedValue({ profile: null });

      await expect(service.connect('user-1', 'NonExistentUser')).rejects.toThrow(NotFoundException);
    });

    it('returns a mapped response that does not contain raw Prisma fields like accessToken', async () => {
      const platformRow = generatePlaystationPlatformRow({ accessToken: 'secret-token', externalId: 'account-id' });
      (psnApi.makeUniversalSearch as jest.Mock).mockResolvedValue(generatePsnUniversalSearchResult({ accountID: 'account-id' }));
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(platformRow);

      const result = await service.connect('user-1', 'TestUser');

      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('maps null lastSyncAt to undefined in the response', async () => {
      const platformRow = generatePlaystationPlatformRow({ lastSyncAt: null, externalId: 'account-id' });
      (psnApi.makeUniversalSearch as jest.Mock).mockResolvedValue(generatePsnUniversalSearchResult({ accountID: 'account-id' }));
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(platformRow);

      const result = await service.connect('user-1', 'TestUser');

      expect(result.lastSyncAt).toBeUndefined();
    });

    it('includes lastSyncAt in the response when the platform row has a date', async () => {
      const syncDate = new Date('2024-06-15T12:00:00Z');
      const platformRow = generatePlaystationPlatformRow({ lastSyncAt: syncDate, externalId: 'account-id' });
      (psnApi.makeUniversalSearch as jest.Mock).mockResolvedValue(generatePsnUniversalSearchResult({ accountID: 'account-id' }));
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(platformRow);

      const result = await service.connect('user-1', 'TestUser');

      expect(result.lastSyncAt).toEqual(syncDate);
    });

    it('obtains authorization before calling PSN APIs', async () => {
      (psnApi.makeUniversalSearch as jest.Mock).mockResolvedValue(generatePsnUniversalSearchResult({ accountID: 'account-id' }));
      (prisma.userPlatform.upsert as jest.Mock).mockResolvedValue(generatePlaystationPlatformRow({ externalId: 'account-id' }));

      await service.connect('user-1', 'TestUser');

      expect(playstationAuth.getAuthorization).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getSyncStatus
  // ---------------------------------------------------------------------------

  describe('getSyncStatus', () => {
    it('returns { connected: true } with lastSyncAt when the platform record exists', async () => {
      const syncDate = new Date('2024-03-10T08:00:00Z');
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(generatePlaystationPlatformRow({ lastSyncAt: syncDate }));

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
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(generatePlaystationPlatformRow({ lastSyncAt: null }));

      const result = await service.getSyncStatus('user-1');

      expect(result.connected).toBe(true);
      expect(result.lastSyncAt).toBeUndefined();
    });

    it('scopes the lookup to the requesting user', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      await service.getSyncStatus('user-42');

      expect(prisma.userPlatform.findUnique).toHaveBeenCalledWith({
        where: { userId_platformId: { userId: 'user-42', platformId: PLATFORM_ID_PLAYSTATION } },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getOwnedGames
  // ---------------------------------------------------------------------------

  describe('getOwnedGames', () => {
    it('returns all games when everything fits in one page', async () => {
      const games = [{ name: 'God of War' }, { name: 'Horizon Zero Dawn' }];
      (psnApi.getUserPlayedGames as jest.Mock).mockResolvedValue({ titles: games, totalItemCount: 2 });

      const result = await service.getOwnedGames('psn-account-id');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('God of War');
    });

    it('paginates and accumulates games across multiple pages', async () => {
      const page1Games = Array.from({ length: 200 }, (_, i) => ({ name: `Game ${i}` }));
      const page2Games = [{ name: 'Last Game' }];

      (psnApi.getUserPlayedGames as jest.Mock)
        .mockResolvedValueOnce({ titles: page1Games, totalItemCount: 201 })
        .mockResolvedValueOnce({ titles: page2Games, totalItemCount: 201 });

      const result = await service.getOwnedGames('psn-account-id');

      expect(psnApi.getUserPlayedGames).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(201);
    });

    it('passes the correct offset on the second page request', async () => {
      const page1Games = Array.from({ length: 200 }, () => ({ name: 'Game' }));
      (psnApi.getUserPlayedGames as jest.Mock)
        .mockResolvedValueOnce({ titles: page1Games, totalItemCount: 201 })
        .mockResolvedValueOnce({ titles: [{ name: 'Extra' }], totalItemCount: 201 });

      await service.getOwnedGames('psn-account-id');

      const secondCallArgs = (psnApi.getUserPlayedGames as jest.Mock).mock.calls[1];
      expect(secondCallArgs[2]).toEqual(expect.objectContaining({ offset: 200 }));
    });

    it('returns an empty array when the account has no played games', async () => {
      (psnApi.getUserPlayedGames as jest.Mock).mockResolvedValue({ titles: [], totalItemCount: 0 });

      const result = await service.getOwnedGames('psn-account-id');

      expect(result).toEqual([]);
      expect(psnApi.getUserPlayedGames).toHaveBeenCalledTimes(1);
    });

    it('obtains authorization before calling getUserPlayedGames', async () => {
      (psnApi.getUserPlayedGames as jest.Mock).mockResolvedValue({ titles: [], totalItemCount: 0 });

      await service.getOwnedGames('psn-account-id');

      expect(playstationAuth.getAuthorization).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // enqueueSync
  // ---------------------------------------------------------------------------

  describe('enqueueSync', () => {
    it('adds a sync job to the queue and returns { queued: true } when PlayStation is connected', async () => {
      const platformRow = generatePlaystationPlatformRow({ externalId: 'psn-account-99' });
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(platformRow);
      playstationQueue.add.mockResolvedValue({});

      const result = await service.enqueueSync('user-1');

      expect(playstationQueue.add).toHaveBeenCalledWith(
        'sync',
        { userID: 'user-1', psnAccountID: 'psn-account-99' },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
      expect(result).toEqual({ queued: true });
    });

    it('returns { queued: false } with a reason when PlayStation is not connected', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.enqueueSync('user-1');

      expect(playstationQueue.add).not.toHaveBeenCalled();
      expect(result.queued).toBe(false);
      expect((result as { queued: boolean; reason?: string }).reason).toBeDefined();
    });

    it('looks up the platform using the correct userId_platformId compound key', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(null);

      await service.enqueueSync('user-77');

      expect(prisma.userPlatform.findUnique).toHaveBeenCalledWith({
        where: { userId_platformId: { userId: 'user-77', platformId: PLATFORM_ID_PLAYSTATION } },
      });
    });

    it('enqueues with retry attempts and exponential backoff configured', async () => {
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(generatePlaystationPlatformRow());
      playstationQueue.add.mockResolvedValue({});

      await service.enqueueSync('user-1');

      const opts = playstationQueue.add.mock.calls[0][2];
      expect(opts.attempts).toBe(3);
      expect(opts.backoff.type).toBe('exponential');
    });

    it('passes the stored externalId as psnAccountID in the job payload', async () => {
      const customAccountID = 'psn-custom-account-42';
      (prisma.userPlatform.findUnique as jest.Mock).mockResolvedValue(generatePlaystationPlatformRow({ externalId: customAccountID }));
      playstationQueue.add.mockResolvedValue({});

      await service.enqueueSync('user-1');

      const payload = playstationQueue.add.mock.calls[0][1];
      expect(payload.psnAccountID).toBe(customAccountID);
    });
  });
});
