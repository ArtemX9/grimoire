import { Test, TestingModule } from '@nestjs/testing';

import { Genre, UnmappedReasons } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { generateUnmappedSyncedGame } from '../../test';
import { GamesService } from '../games/games.service';
import { UnmappedGamesService } from './unmapped-games.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeMapDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    syncedGameID: 'synced-1',
    isMapped: true,
    platformID: 1,
    igdbInfo: {
      id: 12345,
      title: 'The Witcher 3',
      genres: [Genre.RPG],
      releaseDate: new Date('2015-05-19'),
      coverUrl: 'https://example.com/cover.jpg',
      summary: 'A great game',
      storyLine: 'An epic story',
    },
    ...overrides,
  };
}

function makeSyncedGameRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'synced-1',
    platformId: 1,
    externalId: '292030',
    externalTitle: 'The Witcher 3',
    coverUrl: null,
    summary: null,
    ...overrides,
  };
}

function makeUnresolvedRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'unmapped-1',
    userId: 'user-1',
    syncedGameId: 'synced-1',
    reason: 'NO_MATCH',
    isMapped: false,
    igdbGameId: null,
    playtimeHours: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
    syncedGame: makeSyncedGameRow(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('UnmappedGamesService', () => {
  let service: UnmappedGamesService;
  let prisma: jest.Mocked<PrismaService>;
  let gamesService: { ingestFromSync: jest.Mock };

  beforeEach(async () => {
    gamesService = { ingestFromSync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnmappedGamesService,
        {
          provide: PrismaService,
          useValue: {
            unmappedSyncedGame: {
              findMany: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        { provide: GamesService, useValue: gamesService },
      ],
    }).compile();

    service = module.get<UnmappedGamesService>(UnmappedGamesService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getUnmappedGamesForUser
  // ---------------------------------------------------------------------------

  describe('getUnmappedGamesForUser', () => {
    it('returns all unmapped games for the user', async () => {
      const rows = [
        generateUnmappedSyncedGame({ userId: 'user-1', reason: UnmappedReasons.NO_MATCH }),
        generateUnmappedSyncedGame({ userId: 'user-1', reason: UnmappedReasons.LOW_CONFIDENCE }),
      ];
      (prisma.unmappedSyncedGame.findMany as jest.Mock).mockResolvedValue(rows);

      const result = await service.getUnmappedGamesForUser('user-1');

      expect(result).toHaveLength(2);
    });

    it('scopes the query to the requesting user and isMapped: false', async () => {
      (prisma.unmappedSyncedGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.getUnmappedGamesForUser('user-42');

      expect(prisma.unmappedSyncedGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-42', isMapped: false },
        }),
      );
    });

    it('includes syncedGame.platform in the query', async () => {
      (prisma.unmappedSyncedGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.getUnmappedGamesForUser('user-1');

      expect(prisma.unmappedSyncedGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            syncedGame: {
              include: { platform: true },
            },
          },
        }),
      );
    });

    it('orders results by createdAt ascending', async () => {
      (prisma.unmappedSyncedGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.getUnmappedGamesForUser('user-1');

      expect(prisma.unmappedSyncedGame.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { createdAt: 'asc' } }));
    });

    it('applies limit and offset pagination', async () => {
      (prisma.unmappedSyncedGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.getUnmappedGamesForUser('user-1', 5, 10);

      expect(prisma.unmappedSyncedGame.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5, skip: 10 }));
    });

    it('maps the DB row to the UnmappedGame response shape', async () => {
      const row = generateUnmappedSyncedGame({
        id: 'unmapped-id',
        userId: 'user-1',
        syncedGameId: 'synced-id',
        reason: UnmappedReasons.LOW_CONFIDENCE,
        isMapped: false,
        syncedGame: {
          id: 'synced-id',
          platformId: 1,
          externalId: '292030',
          externalTitle: 'CS:GO',
          coverUrl: null,
          summary: null,
          platform: { id: 1, platform: 'STEAM' },
        },
      });
      (prisma.unmappedSyncedGame.findMany as jest.Mock).mockResolvedValue([row]);

      const [result] = await service.getUnmappedGamesForUser('user-1');

      expect(result.id).toBe('unmapped-id');
      expect(result.syncedGameID).toBe('synced-id');
      expect(result.reason).toBe(UnmappedReasons.LOW_CONFIDENCE);
      expect(result.isMapped).toBe(false);
      expect(result.syncedGameTitle).toBe('CS:GO');
      expect(result.platform).toEqual({ id: 1, platform: 'STEAM' });
      expect(result.playtimeHours).toBe(row.playtimeHours);
      expect(result.coverURL).toBeUndefined();
    });

    it('maps coverUrl from syncedGame to coverURL in the response', async () => {
      const row = generateUnmappedSyncedGame({
        syncedGame: {
          id: 'synced-id',
          platformId: 1,
          externalId: '292030',
          externalTitle: 'CS:GO',
          coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
          summary: null,
          platform: { id: 1, platform: 'STEAM' },
        },
      });
      (prisma.unmappedSyncedGame.findMany as jest.Mock).mockResolvedValue([row]);

      const [result] = await service.getUnmappedGamesForUser('user-1');

      expect(result.coverURL).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg');
    });

    it('returns an empty array when the user has no unmapped games', async () => {
      (prisma.unmappedSyncedGame.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUnmappedGamesForUser('user-1');

      expect(result).toEqual([]);
    });

    it('throws when an unrecognised reason is encountered', async () => {
      const row = generateUnmappedSyncedGame({ reason: 'UNKNOWN_REASON' as UnmappedReasons });
      (prisma.unmappedSyncedGame.findMany as jest.Mock).mockResolvedValue([row]);

      await expect(service.getUnmappedGamesForUser('user-1')).rejects.toThrow('Unknown unmapped reason');
    });
  });

  // ---------------------------------------------------------------------------
  // mapGameForUser
  // ---------------------------------------------------------------------------

  describe('mapGameForUser', () => {
    it('runs the entire operation inside a transaction', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        const tx = {
          unmappedSyncedGame: {
            findUniqueOrThrow: jest.fn().mockResolvedValue(makeUnresolvedRow()),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });
      gamesService.ingestFromSync.mockResolvedValue({});

      await service.mapGameForUser('user-1', 'unmapped-1', makeMapDto());

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('looks up the unmapped game by id and userId inside the transaction', async () => {
      const findUniqueOrThrow = jest.fn().mockResolvedValue(makeUnresolvedRow());
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        return fn({
          unmappedSyncedGame: { findUniqueOrThrow, update: jest.fn().mockResolvedValue({}) },
        });
      });
      gamesService.ingestFromSync.mockResolvedValue({});

      await service.mapGameForUser('user-1', 'unmapped-1', makeMapDto());

      expect(findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'unmapped-1', userId: 'user-1' },
        }),
      );
    });

    it('calls ingestFromSync with the transaction client, not this.prisma', async () => {
      const tx = {
        unmappedSyncedGame: {
          findUniqueOrThrow: jest.fn().mockResolvedValue(makeUnresolvedRow()),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<void>) => fn(tx));
      gamesService.ingestFromSync.mockResolvedValue({});

      await service.mapGameForUser('user-1', 'unmapped-1', makeMapDto());

      // The 4th argument must be the tx client — not undefined and not prisma
      expect(gamesService.ingestFromSync).toHaveBeenCalledWith('user-1', expect.any(Object), expect.any(Object), tx);
    });

    it('builds syncedGameInfo from the synced game row found in the transaction', async () => {
      const unresolvedRow = makeUnresolvedRow({
        playtimeHours: 12.5,
        syncedGame: makeSyncedGameRow({
          id: 'synced-1',
          externalId: 'ext-42',
          platformId: 1,
          externalTitle: 'My Game',
          coverUrl: 'https://example.com/img.jpg',
        }),
      });
      const tx = {
        unmappedSyncedGame: {
          findUniqueOrThrow: jest.fn().mockResolvedValue(unresolvedRow),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<void>) => fn(tx));
      gamesService.ingestFromSync.mockResolvedValue({});

      await service.mapGameForUser('user-1', 'unmapped-1', makeMapDto());

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          id: 'ext-42',
          platformID: 1,
          externalTitle: 'My Game',
          coverURL: 'https://example.com/img.jpg',
          playtimeHours: 12.5,
        }),
        expect.any(Object),
        tx,
      );
    });

    it('builds igdbInfo from the dto', async () => {
      const tx = {
        unmappedSyncedGame: {
          findUniqueOrThrow: jest.fn().mockResolvedValue(makeUnresolvedRow()),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<void>) => fn(tx));
      gamesService.ingestFromSync.mockResolvedValue({});

      const dto = makeMapDto();
      await service.mapGameForUser('user-1', 'unmapped-1', dto);

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object),
        expect.objectContaining({
          id: dto.igdbInfo.id,
          title: dto.igdbInfo.title,
          genres: dto.igdbInfo.genres,
        }),
        tx,
      );
    });

    it('marks isMapped: true and sets igdbGameId on the unmapped row after ingest', async () => {
      const update = jest.fn().mockResolvedValue({});
      const tx = {
        unmappedSyncedGame: {
          findUniqueOrThrow: jest.fn().mockResolvedValue(makeUnresolvedRow()),
          update,
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<void>) => fn(tx));
      gamesService.ingestFromSync.mockResolvedValue({});

      const dto = makeMapDto({ syncedGameID: 'synced-1' });
      await service.mapGameForUser('user-1', 'unmapped-1', dto);

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_syncedGameId: { userId: 'user-1', syncedGameId: dto.syncedGameID },
          },
          data: {
            isMapped: true,
            igdbGameId: dto.igdbInfo.id,
          },
        }),
      );
    });

    it('throws when the unmapped game is not found or belongs to a different user', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        return fn({
          unmappedSyncedGame: {
            findUniqueOrThrow: jest.fn().mockRejectedValue(new Error('Record not found')),
            update: jest.fn(),
          },
        });
      });

      await expect(service.mapGameForUser('user-1', 'wrong-id', makeMapDto())).rejects.toThrow('Record not found');
      expect(gamesService.ingestFromSync).not.toHaveBeenCalled();
    });

    it('does not call the prisma singleton directly — uses the tx client for all queries', async () => {
      const tx = {
        unmappedSyncedGame: {
          findUniqueOrThrow: jest.fn().mockResolvedValue(makeUnresolvedRow()),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<void>) => fn(tx));
      gamesService.ingestFromSync.mockResolvedValue({});

      await service.mapGameForUser('user-1', 'unmapped-1', makeMapDto());

      expect(prisma.unmappedSyncedGame.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(prisma.unmappedSyncedGame.update).not.toHaveBeenCalled();
    });
  });
});
