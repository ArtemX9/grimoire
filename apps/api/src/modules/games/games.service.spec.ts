import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { GameStatus, Genre, Mood, Platform, SortableField, Theme } from '@grimoire/shared';

import { UnmappedReason } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { generateRemapGameDto } from '../../test';
import { GamesService } from './games.service';
import { GameResponse, GameStatsResponse, IgdbSyncGameInfo, IngestedSyncGameInfo } from './games.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeIgdbGame(overrides: Record<string, unknown> = {}) {
  return {
    id: 'igdb-1',
    igdbId: 12345,
    title: 'The Witcher 3',
    coverUrl: null,
    genres: ['RPG', 'Open World'],
    summary: 'A great game',
    storyLine: null,
    releaseDate: null,
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeSyncedGame(overrides: Record<string, unknown> = {}) {
  return {
    id: 'synced-1',
    platformId: 1,
    externalId: 'steam-730',
    externalTitle: 'CS:GO',
    coverUrl: null,
    summary: null,
    platform: { id: 1, platform: 'STEAM' },
    ...overrides,
  };
}

function makePrismaGame(overrides: Record<string, unknown> = {}) {
  return {
    id: 'game-1',
    userId: 'user-1',
    igdbGameId: 'igdb-1',
    status: 'PLAYING',
    playtimeHours: 42,
    userRating: null,
    notes: null,
    moods: ['focused'],
    addedAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
    isMappedManually: false,
    igdbGame: makeIgdbGame(),
    userGamePlatforms: [],
    ...overrides,
  };
}

function makeUserGamePlatformRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ugp-1',
    userGameId: 'game-1',
    syncedGameId: 'synced-1',
    userGame: { isMappedManually: false, playtimeHours: 42 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('GamesService', () => {
  let service: GamesService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: PrismaService,
          useValue: {
            userGame: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
              aggregate: jest.fn(),
            },
            iGDBGame: {
              upsert: jest.fn(),
              findUniqueOrThrow: jest.fn(),
            },
            syncedGame: {
              upsert: jest.fn(),
            },
            unmappedSyncedGame: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
            userGamePlatform: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns all games for the user', async () => {
      const rows = [makePrismaGame({ id: 'game-2' }), makePrismaGame()];
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue(rows);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('game-2');
    });

    it('scopes query to the requesting user', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-2');

      expect(prisma.userGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-2' }) }),
      );
    });

    it('passes status filter when provided', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', GameStatus.PLAYING);

      expect(prisma.userGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: GameStatus.PLAYING }) }),
      );
    });

    it('omits status clause when no status is provided', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).not.toHaveProperty('status');
    });

    it('passes search as case-insensitive igdbGame.title contains', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', undefined, 'witcher');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.igdbGame.title).toEqual({ contains: 'witcher', mode: 'insensitive' });
    });

    it('maps igdbGame fields into the response', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([makePrismaGame()]);

      const [result] = await service.findAll('user-1');

      expect(result.igdbID).toBe(12345);
      expect(result.title).toBe('The Witcher 3');
      expect(result.genres).toEqual(['RPG', 'Open World']);
    });

    it('maps null coverUrl to undefined', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([makePrismaGame()]);

      const [result] = await service.findAll('user-1');

      expect(result.coverURL).toBeUndefined();
    });

    it('maps populated coverUrl through correctly', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([
        makePrismaGame({ igdbGame: makeIgdbGame({ coverUrl: 'https://img.example.com/cover.jpg' }) }),
      ]);

      const [result] = await service.findAll('user-1');

      expect(result.coverURL).toBe('https://img.example.com/cover.jpg');
    });

    it('maps platform info from userGamePlatforms', async () => {
      const game = makePrismaGame({
        userGamePlatforms: [
          {
            id: 'ugp-1',
            userGameId: 'game-1',
            syncedGameId: 'synced-1',
            syncedGame: makeSyncedGame({ externalId: 'steam-730', externalTitle: 'CS:GO', platform: { id: 1, platform: 'STEAM' } }),
          },
        ],
      });
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([game]);

      const [result] = await service.findAll('user-1');

      expect(result.platforms).toHaveLength(1);
      expect(result.platforms[0]).toMatchObject({
        platformID: 1,
        platformName: 'STEAM',
        externalID: 'steam-730',
        externalTitle: 'CS:GO',
      });
    });

    it('returns empty array when the user has no games', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll('user-1');

      expect(result).toEqual([]);
    });

    it('maps null userRating and notes to undefined', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([makePrismaGame({ userRating: null, notes: null })]);

      const [result] = await service.findAll('user-1');

      expect(result.userRating).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('passes platform filter via userGamePlatforms.some when provided', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', undefined, undefined, undefined, Platform.STEAM);

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.userGamePlatforms).toEqual({
        some: {
          syncedGame: {
            platform: {
              platform: Platform.STEAM,
            },
          },
        },
      });
    });

    it('omits userGamePlatforms clause when no platform is provided', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).not.toHaveProperty('userGamePlatforms');
    });

    it('orders by playtimeHours when sortBy is playtimeHours', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', undefined, undefined, undefined, undefined, SortableField.playtimeHours, 'desc');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.orderBy).toEqual({ playtimeHours: 'desc' });
    });

    it('orders by addedAt when sortBy is addedAt', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', undefined, undefined, undefined, undefined, SortableField.addedAt, 'asc');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.orderBy).toEqual({ addedAt: 'asc' });
    });

    it('orders by status when sortBy is status', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', undefined, undefined, undefined, undefined, SortableField.status, 'asc');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.orderBy).toEqual({ status: 'asc' });
    });

    it('orders by userRating when sortBy is userRating', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', undefined, undefined, undefined, undefined, SortableField.userRating, 'desc');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.orderBy).toEqual({ userRating: 'desc' });
    });

    it('orders by igdbGame.releaseDate when sortBy is releaseDate', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', undefined, undefined, undefined, undefined, SortableField.releaseDate, 'desc');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.orderBy).toEqual({ igdbGame: { releaseDate: 'desc' } });
    });

    it('defaults to ordering by igdbGame.title asc when no sortBy is provided', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.orderBy).toEqual({ igdbGame: { title: 'asc' } });
    });

    it('respects the order param when defaulting to title sort', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', undefined, undefined, undefined, undefined, undefined, 'desc');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.orderBy).toEqual({ igdbGame: { title: 'desc' } });
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------

  describe('findOne', () => {
    it('returns the game when it belongs to the requesting user', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame());

      const result = await service.findOne('user-1', 'game-1');

      expect(result.id).toBe('game-1');
      expect(result.title).toBe('The Witcher 3');
    });

    it('scopes query to userId + gameId', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame());

      await service.findOne('user-1', 'game-1');

      expect(prisma.userGame.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'game-1', userId: 'user-1' }) }),
      );
    });

    it('throws NotFoundException when game does not exist', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when game belongs to a different user', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('user-2', 'game-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException with message "Game not found"', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('user-1', 'game-1')).rejects.toThrow('Game not found');
    });

    it('includes all required fields in the response', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(
        makePrismaGame({
          igdbGame: makeIgdbGame({ coverUrl: 'https://example.com/cover.png' }),
          userRating: 8,
          notes: 'Brilliant',
        }),
      );

      const result = await service.findOne('user-1', 'game-1');

      expect(result).toMatchObject<Partial<GameResponse>>({
        id: 'game-1',
        userID: 'user-1',
        igdbID: 12345,
        title: 'The Witcher 3',
        coverURL: 'https://example.com/cover.png',
        genres: ['RPG', 'Open World'] as unknown as Genre[],
        status: GameStatus.PLAYING,
        playtimeHours: 42,
        userRating: 8,
        notes: 'Brilliant',
        moods: ['focused'] as unknown as Mood[],
        isMappedManually: false,
        platforms: [],
      });
    });
  });

  // ---------------------------------------------------------------------------
  // addManually
  // ---------------------------------------------------------------------------

  describe('addManually', () => {
    const dto = {
      igdbId: 12345,
      title: 'The Witcher 3',
      coverUrl: undefined,
      genres: [Genre.RPG],
      summary: 'Great game',
      storyLine: 'Epic story',
      releaseDate: new Date('2015-05-19'),
      status: GameStatus.BACKLOG,
      moods: [] as Mood[],
      notes: undefined,
      platformId: 1,
      externalId: undefined,
      externalTitle: undefined,
      themes: [] as Theme[],
    };

    it('upserts IGDBGame by igdbId', async () => {
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(makeIgdbGame());
      (prisma.userGame.create as jest.Mock).mockResolvedValue(makePrismaGame());

      await service.addManually('user-1', dto);

      expect(prisma.iGDBGame.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { igdbId: dto.igdbId } }));
    });

    it('creates UserGame with correct fields and zero playtime', async () => {
      const igdbGame = makeIgdbGame({ id: 'igdb-1' });
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbGame);
      (prisma.userGame.create as jest.Mock).mockResolvedValue(makePrismaGame());

      await service.addManually('user-1', dto);

      expect(prisma.userGame.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            igdbGameId: 'igdb-1',
            status: dto.status,
            playtimeHours: 0,
            userRating: null,
          }),
        }),
      );
    });

    it('returns response with empty platforms array', async () => {
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(makeIgdbGame());
      (prisma.userGame.create as jest.Mock).mockResolvedValue(makePrismaGame());

      const result = await service.addManually('user-1', dto);

      expect(result.platforms).toEqual([]);
    });

    it('returns igdb fields in response', async () => {
      const igdbGame = makeIgdbGame({ coverUrl: 'https://example.com/cover.jpg' });
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbGame);
      (prisma.userGame.create as jest.Mock).mockResolvedValue(makePrismaGame({ igdbGame }));

      const result = await service.addManually('user-1', dto);

      expect(result.igdbID).toBe(12345);
      expect(result.title).toBe('The Witcher 3');
      expect(result.coverURL).toBe('https://example.com/cover.jpg');
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe('update', () => {
    const dto = { status: GameStatus.COMPLETED, playtimeHours: 100 };

    it('updates game when it belongs to the requesting user', async () => {
      (prisma.userGame.update as jest.Mock).mockResolvedValue(makePrismaGame({ status: 'COMPLETED', playtimeHours: 100 }));

      const result = await service.update('user-1', 'game-1', dto);

      expect(result.status).toBe(GameStatus.COMPLETED);
      expect(result.playtimeHours).toBe(100);
    });

    it('throws BadRequestException when game does not exist or belongs to a different user', async () => {
      (prisma.userGame.update as jest.Mock).mockRejectedValue(new Error('Record not found'));

      await expect(service.update('user-1', 'nonexistent', dto)).rejects.toThrow(BadRequestException);
    });

    it('scopes the update to both id and userId', async () => {
      (prisma.userGame.update as jest.Mock).mockResolvedValue(makePrismaGame());

      await service.update('user-1', 'game-1', dto);

      expect(prisma.userGame.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'game-1', userId: 'user-1' } }));
    });

    it('passes the correct data fields to update', async () => {
      const fullDto = { status: GameStatus.COMPLETED, userRating: 9, moods: [Mood.FOCUSED], notes: 'great', playtimeHours: 100 };
      (prisma.userGame.update as jest.Mock).mockResolvedValue(makePrismaGame());

      await service.update('user-1', 'game-1', fullDto);

      expect(prisma.userGame.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userRating: 9,
            moods: [Mood.FOCUSED],
            notes: 'great',
            status: GameStatus.COMPLETED,
          }),
        }),
      );
    });

    it('maps null optional fields to undefined in the response', async () => {
      (prisma.userGame.update as jest.Mock).mockResolvedValue(makePrismaGame({ userRating: null, notes: null }));

      const result = await service.update('user-1', 'game-1', dto);

      expect(result.userRating).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------

  describe('remove', () => {
    beforeEach(() => {
      (prisma.userGamePlatform.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.unmappedSyncedGame.upsert as jest.Mock).mockResolvedValue({});
    });

    it('deletes game when it belongs to the requesting user', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame());
      (prisma.userGame.delete as jest.Mock).mockResolvedValue({});

      await expect(service.remove('user-1', 'game-1')).resolves.toBeUndefined();
      expect(prisma.userGame.delete).toHaveBeenCalledWith({ where: { id: 'game-1' } });
    });

    it('throws NotFoundException when game does not exist', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.userGame.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when game belongs to a different user', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('user-2', 'game-1')).rejects.toThrow(NotFoundException);
      expect(prisma.userGame.delete).not.toHaveBeenCalled();
    });

    it('performs ownership check with correct userId and gameId', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame());
      (prisma.userGame.delete as jest.Mock).mockResolvedValue({});

      await service.remove('user-1', 'game-1');

      expect(prisma.userGame.findUnique).toHaveBeenCalledWith({
        where: { id: 'game-1', userId: 'user-1' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getStats
  // ---------------------------------------------------------------------------

  describe('getStats', () => {
    it('returns aggregated stats for the user', async () => {
      (prisma.userGame.count as jest.Mock).mockResolvedValue(10);
      (prisma.userGame.groupBy as jest.Mock).mockResolvedValue([
        { status: 'PLAYING', _count: 3 },
        { status: 'COMPLETED', _count: 7 },
      ]);
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({ _sum: { playtimeHours: 250 } });

      const result = await service.getStats('user-1');

      expect(result).toMatchObject<GameStatsResponse>({
        total: 10,
        byStatus: [
          { status: 'PLAYING', _count: 3 },
          { status: 'COMPLETED', _count: 7 },
        ],
        totalHours: 250,
      });
    });

    it('returns 0 for totalHours when aggregate sum is null', async () => {
      (prisma.userGame.count as jest.Mock).mockResolvedValue(0);
      (prisma.userGame.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({ _sum: { playtimeHours: null } });

      const result = await service.getStats('user-1');

      expect(result.totalHours).toBe(0);
    });

    it('scopes all queries to the requesting userId', async () => {
      (prisma.userGame.count as jest.Mock).mockResolvedValue(0);
      (prisma.userGame.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({ _sum: { playtimeHours: null } });

      await service.getStats('user-42');

      expect(prisma.userGame.count).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-42' } }));
      expect(prisma.userGame.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-42' } }));
      expect(prisma.userGame.aggregate).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-42' } }));
    });

    it('uses correct groupBy fields and _count', async () => {
      (prisma.userGame.count as jest.Mock).mockResolvedValue(0);
      (prisma.userGame.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({ _sum: { playtimeHours: null } });

      await service.getStats('user-1');

      expect(prisma.userGame.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ['status'], _count: true }));
    });
  });

  // ---------------------------------------------------------------------------
  // ingestFromSync
  // ---------------------------------------------------------------------------

  describe('ingestFromSync', () => {
    const syncedGameInfo: IngestedSyncGameInfo = {
      id: 'steam-730',
      platformID: 1,
      externalTitle: 'CS:GO',
      coverURL: undefined,
      summary: undefined,
      playtimeHours: 100,
    };

    const igdbInfo: IgdbSyncGameInfo = {
      id: 12345,
      title: 'CS:GO',
      coverURL: '',
      genres: [Genre.Shooter],
      themes: [Theme.Action],
      summary: undefined,
      storyLine: undefined,
      releaseDate: undefined,
    };

    beforeEach(() => {
      (prisma.syncedGame.upsert as jest.Mock).mockResolvedValue({
        id: 'synced-1',
        platformId: 1,
        externalId: 'steam-730',
        externalTitle: 'CS:GO',
        coverUrl: null,
        summary: null,
      });
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(makeIgdbGame({ id: 'igdb-cs', igdbId: 12345 }));
    });

    it('upserts SyncedGame and IGDBGame on every call', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.create as jest.Mock).mockResolvedValue({ id: 'game-new', userId: 'user-1', igdbGameId: 'igdb-cs' });
      (prisma.userGamePlatform.create as jest.Mock).mockResolvedValue({});
      (prisma.userGame.findUniqueOrThrow as jest.Mock).mockResolvedValue(makePrismaGame({ id: 'game-new' }));

      await service.ingestFromSync('user-1', syncedGameInfo, igdbInfo);

      expect(prisma.syncedGame.upsert).toHaveBeenCalled();
      expect(prisma.iGDBGame.upsert).toHaveBeenCalled();
    });

    it('returns existing game unchanged when isMappedManually=true', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(
        makeUserGamePlatformRecord({ userGame: { isMappedManually: true, playtimeHours: 42 } }),
      );
      (prisma.userGame.findUniqueOrThrow as jest.Mock).mockResolvedValue(makePrismaGame({ isMappedManually: true }));

      const result = await service.ingestFromSync('user-1', syncedGameInfo, igdbInfo);

      expect(prisma.userGame.update).not.toHaveBeenCalled();
      expect(prisma.userGame.create).not.toHaveBeenCalled();
      expect(result!.isMappedManually).toBe(true);
    });

    it('updates playtime when incoming is higher than stored', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(
        makeUserGamePlatformRecord({ userGame: { isMappedManually: false, playtimeHours: 42 } }),
      );
      (prisma.userGame.update as jest.Mock).mockResolvedValue(makePrismaGame({ playtimeHours: 100 }));

      const result = await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: 100 }, igdbInfo);

      expect(prisma.userGame.update).toHaveBeenCalledWith(expect.objectContaining({ data: { playtimeHours: 100 } }));
      expect(result!.playtimeHours).toBe(100);
    });

    it('does not update playtime when incoming is lower', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(
        makeUserGamePlatformRecord({ userGame: { isMappedManually: false, playtimeHours: 200 } }),
      );
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame({ playtimeHours: 200 }));

      await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: 50 }, igdbInfo);

      expect(prisma.userGame.update).not.toHaveBeenCalled();
    });

    it('does not replace existing playtime with a smaller synced value', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(
        makeUserGamePlatformRecord({ userGame: { isMappedManually: false, playtimeHours: 2 } }),
      );
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame({ playtimeHours: 2 }));

      const result = await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: 0.5 }, igdbInfo);

      expect(prisma.userGame.update).not.toHaveBeenCalled();
      expect(result!.playtimeHours).toBe(2);
    });

    it('updates playtime when synced value is greater than existing', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(
        makeUserGamePlatformRecord({ userGame: { isMappedManually: false, playtimeHours: 2 } }),
      );
      (prisma.userGame.update as jest.Mock).mockResolvedValue(makePrismaGame({ playtimeHours: 4 }));

      const result = await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: 4 }, igdbInfo);

      expect(prisma.userGame.update).toHaveBeenCalledWith(expect.objectContaining({ data: { playtimeHours: 4 } }));
      expect(result!.playtimeHours).toBe(4);
    });

    it('creates UserGame and UserGamePlatform when game is not yet linked', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.create as jest.Mock).mockResolvedValue({ id: 'game-new', userId: 'user-1', igdbGameId: 'igdb-cs' });
      (prisma.userGamePlatform.create as jest.Mock).mockResolvedValue({});
      (prisma.userGame.findUniqueOrThrow as jest.Mock).mockResolvedValue(makePrismaGame({ id: 'game-new' }));

      const result = await service.ingestFromSync('user-1', syncedGameInfo, igdbInfo);

      expect(prisma.userGame.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', status: GameStatus.BACKLOG }),
        }),
      );
      expect(prisma.userGamePlatform.create).toHaveBeenCalled();
      expect(result!.id).toBe('game-new');
    });

    it('sets playtimeHours to 0 when incoming playtimeHours is undefined', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.create as jest.Mock).mockResolvedValue({ id: 'game-new', userId: 'user-1', igdbGameId: 'igdb-cs' });
      (prisma.userGamePlatform.create as jest.Mock).mockResolvedValue({});
      (prisma.userGame.findUniqueOrThrow as jest.Mock).mockResolvedValue(makePrismaGame({ id: 'game-new' }));

      await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: undefined }, igdbInfo);

      expect(prisma.userGame.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ playtimeHours: 0 }),
        }),
      );
    });

    it('upserts NO_MATCH and returns null when no IGDB info and game is new', async () => {
      (prisma.unmappedSyncedGame.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.ingestFromSync('user-1', syncedGameInfo, undefined);

      expect(prisma.unmappedSyncedGame.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_syncedGameId: { userId: 'user-1', syncedGameId: 'synced-1' } },
          create: expect.objectContaining({ reason: UnmappedReason.NO_MATCH, isMapped: false }),
          update: { reason: UnmappedReason.NO_MATCH },
        }),
      );
      expect(result).toBeNull();
    });

    it('upserts NO_MATCH and returns null when no IGDB info and existing row is not mapped', async () => {
      (prisma.unmappedSyncedGame.findUnique as jest.Mock).mockResolvedValue({ isMapped: false, igdbGameId: null });

      const result = await service.ingestFromSync('user-1', syncedGameInfo, undefined);

      expect(prisma.unmappedSyncedGame.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_syncedGameId: { userId: 'user-1', syncedGameId: 'synced-1' } },
          update: { reason: UnmappedReason.NO_MATCH },
        }),
      );
      expect(result).toBeNull();
    });

    it('uses findUniqueOrThrow to load IGDB row when game was previously manually mapped', async () => {
      const igdbRow = makeIgdbGame({ id: 'igdb-cs', igdbId: 12345, title: 'CS:GO' });
      (prisma.unmappedSyncedGame.findUnique as jest.Mock).mockResolvedValue({ isMapped: true, igdbGameId: 12345 });
      (prisma.iGDBGame.findUniqueOrThrow as jest.Mock).mockResolvedValue(igdbRow);
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.create as jest.Mock).mockResolvedValue({ id: 'game-new', userId: 'user-1', igdbGameId: 'igdb-cs' });
      (prisma.userGamePlatform.create as jest.Mock).mockResolvedValue({});
      (prisma.userGame.findUniqueOrThrow as jest.Mock).mockResolvedValue(makePrismaGame({ id: 'game-new', igdbGame: igdbRow }));

      await service.ingestFromSync('user-1', syncedGameInfo, undefined);

      expect(prisma.iGDBGame.upsert).not.toHaveBeenCalled();
      expect(prisma.iGDBGame.findUniqueOrThrow).toHaveBeenCalledWith({ where: { igdbId: 12345 } });
      expect(prisma.userGame.create).toHaveBeenCalled();
    });

    it('upserts LOW_CONFIDENCE and returns null when title similarity is below threshold', async () => {
      const lowConfidenceIgdbInfo: IgdbSyncGameInfo = {
        ...igdbInfo,
        title: 'Totally Unrelated RPG Game',
      };

      const result = await service.ingestFromSync('user-1', syncedGameInfo, lowConfidenceIgdbInfo);

      expect(prisma.unmappedSyncedGame.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_syncedGameId: { userId: 'user-1', syncedGameId: 'synced-1' } },
          update: { reason: UnmappedReason.LOW_CONFIDENCE, playtimeHours: 100 },
        }),
      );
      expect(result).toBeNull();
    });

    it('upserts DUPLICATE_MATCH and returns null when existing game has non-matching platform title', async () => {
      const igdbRow = makeIgdbGame({ id: 'igdb-cs', igdbId: 12345, title: 'CS:GO' });
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbRow);
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(
        makePrismaGame({
          id: 'game-existing',
          igdbGame: igdbRow,
          userGamePlatforms: [
            {
              id: 'ugp-2',
              userGameId: 'game-existing',
              syncedGameId: 'synced-2',
              syncedGame: makeSyncedGame({ externalTitle: 'Totally Unrelated Game' }),
            },
          ],
        }),
      );

      const result = await service.ingestFromSync('user-1', syncedGameInfo, igdbInfo);

      expect(prisma.unmappedSyncedGame.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_syncedGameId: { userId: 'user-1', syncedGameId: 'synced-1' } },
          update: { reason: UnmappedReason.DUPLICATE_MATCH, playtimeHours: 100 },
        }),
      );
      expect(result).toBeNull();
    });

    it('creates new platform link and returns game when existing game has matching platform title', async () => {
      const igdbRow = makeIgdbGame({ id: 'igdb-cs', igdbId: 12345, title: 'CS:GO' });
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbRow);
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.findUnique as jest.Mock)
        .mockResolvedValueOnce(
          makePrismaGame({
            id: 'game-existing',
            igdbGame: igdbRow,
            userGamePlatforms: [
              {
                id: 'ugp-2',
                userGameId: 'game-existing',
                syncedGameId: 'synced-2',
                syncedGame: makeSyncedGame({ externalTitle: 'CS:GO' }),
              },
            ],
          }),
        )
        .mockResolvedValueOnce(makePrismaGame({ id: 'game-existing', igdbGame: igdbRow }));
      (prisma.userGamePlatform.create as jest.Mock).mockResolvedValue({});

      const result = await service.ingestFromSync('user-1', syncedGameInfo, igdbInfo);

      expect(prisma.userGamePlatform.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userGameId: 'game-existing', syncedGameId: 'synced-1' },
        }),
      );
      expect(result).not.toBeNull();
    });

    it('does not overwrite existing rating, notes, or moods when mapping to a game already in the library', async () => {
      // The existing library entry has user-curated data. The incoming sync carries only
      // platform playtime — it must never clobber rating, notes, or moods.
      const igdbRow = makeIgdbGame({ id: 'igdb-cs', igdbId: 12345, title: 'CS:GO' });
      const existingGame = makePrismaGame({
        id: 'game-existing',
        igdbGame: igdbRow,
        playtimeHours: 10,
        userRating: 9,
        notes: 'Great competitive shooter',
        moods: ['focused', 'excited'],
        userGamePlatforms: [
          {
            id: 'ugp-2',
            userGameId: 'game-existing',
            syncedGameId: 'synced-2',
            syncedGame: makeSyncedGame({ externalTitle: 'CS:GO' }),
          },
        ],
      });
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbRow);
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingGame)
        .mockResolvedValueOnce(makePrismaGame({ id: 'game-existing', igdbGame: igdbRow }));
      (prisma.userGamePlatform.create as jest.Mock).mockResolvedValue({});

      // Incoming sync has lower playtime — no update should fire at all
      await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: 4 }, igdbInfo);

      expect(prisma.userGame.update).not.toHaveBeenCalled();
    });

    it('keeps higher playtime of existing game when mapped game has fewer hours (existing 6h, unmapped 4h → 6h)', async () => {
      const igdbRow = makeIgdbGame({ id: 'igdb-cs', igdbId: 12345, title: 'CS:GO' });
      const existingGame = makePrismaGame({
        id: 'game-existing',
        igdbGame: igdbRow,
        playtimeHours: 6,
        userRating: 8,
        notes: 'Solid FPS',
        moods: ['focused'],
        userGamePlatforms: [
          {
            id: 'ugp-2',
            userGameId: 'game-existing',
            syncedGameId: 'synced-2',
            syncedGame: makeSyncedGame({ externalTitle: 'CS:GO' }),
          },
        ],
      });
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbRow);
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingGame)
        .mockResolvedValueOnce(makePrismaGame({ id: 'game-existing', playtimeHours: 6, igdbGame: igdbRow }));
      (prisma.userGamePlatform.create as jest.Mock).mockResolvedValue({});

      const result = await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: 4 }, igdbInfo);

      // playtime must not be overwritten with the lower incoming value
      expect(prisma.userGame.update).not.toHaveBeenCalled();
      expect(result!.playtimeHours).toBe(6);
    });

    it('keeps higher playtime of unmapped game when it has more hours (existing 4h, unmapped 6h → 6h)', async () => {
      const igdbRow = makeIgdbGame({ id: 'igdb-cs', igdbId: 12345, title: 'CS:GO' });
      const existingGame = makePrismaGame({
        id: 'game-existing',
        igdbGame: igdbRow,
        playtimeHours: 4,
        userGamePlatforms: [
          {
            id: 'ugp-2',
            userGameId: 'game-existing',
            syncedGameId: 'synced-2',
            syncedGame: makeSyncedGame({ externalTitle: 'CS:GO' }),
          },
        ],
      });
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbRow);
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userGame.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingGame)
        .mockResolvedValueOnce(makePrismaGame({ id: 'game-existing', playtimeHours: 6, igdbGame: igdbRow }));
      (prisma.userGame.update as jest.Mock).mockResolvedValue(makePrismaGame({ id: 'game-existing', playtimeHours: 6, igdbGame: igdbRow }));
      (prisma.userGamePlatform.create as jest.Mock).mockResolvedValue({});

      const result = await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: 6 }, igdbInfo);

      expect(prisma.userGame.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'game-existing' },
          data: { playtimeHours: 6 },
        }),
      );
      expect(result!.playtimeHours).toBe(6);
    });

    it('returns existing game without update when playtime is equal', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(
        makeUserGamePlatformRecord({ userGame: { isMappedManually: false, playtimeHours: 100 } }),
      );
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame({ playtimeHours: 100 }));

      await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: 100 }, igdbInfo);

      expect(prisma.userGame.update).not.toHaveBeenCalled();
      expect(prisma.userGame.findUnique).toHaveBeenCalled();
    });

    it('returns null and does not create a UserGame when the user previously deleted the game', async () => {
      (prisma.unmappedSyncedGame.findUnique as jest.Mock).mockResolvedValue({
        reason: UnmappedReason.USER_DELETED,
      });

      const result = await service.ingestFromSync('user-1', syncedGameInfo, igdbInfo);

      expect(result).toBeNull();
      expect(prisma.userGame.create).not.toHaveBeenCalled();
      expect(prisma.userGamePlatform.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // remap — playtime merging
  // ---------------------------------------------------------------------------

  describe('remap — playtime merging when target already exists in library', () => {
    const PLATFORM_ID = 1;
    const EXTERNAL_ID = 'xbox-app-123';
    const ORIGINAL_GAME_ID = 'game-original';
    const TARGET_GAME_ID = 'game-target';
    const IGDB_GAME_ID = 'igdb-target';
    const SYNCED_GAME_ID = 'synced-xbox';

    const igdbGame = makeIgdbGame({ id: IGDB_GAME_ID, igdbId: 99999, title: 'Halo Infinite' });

    const remapDto = generateRemapGameDto({
      igdbId: 99999,
      title: 'Halo Infinite',
      platformId: PLATFORM_ID,
    });
    const remapDtoWithExternalId = { ...remapDto, externalId: EXTERNAL_ID };

    function buildTx(params: {
      originalPlaytime: number;
      targetPlaytime: number;
      originalOverrides?: Record<string, unknown>;
      targetOverrides?: Record<string, unknown>;
      updatedTargetGame?: Record<string, unknown>;
    }) {
      const syncedGame = makeSyncedGame({ id: SYNCED_GAME_ID, platformId: PLATFORM_ID, externalId: EXTERNAL_ID });
      const originalGame = makePrismaGame({ id: ORIGINAL_GAME_ID, playtimeHours: params.originalPlaytime, isMappedManually: false, ...(params.originalOverrides ?? {}) });
      const targetGame = makePrismaGame({ id: TARGET_GAME_ID, igdbGameId: IGDB_GAME_ID, playtimeHours: params.targetPlaytime, isMappedManually: true, ...(params.targetOverrides ?? {}) });
      const targetGameAfterPlaytimeUpdate = makePrismaGame({
        ...targetGame,
        ...(params.updatedTargetGame ?? {}),
      });

      return {
        syncedGame: {
          findUnique: jest.fn().mockResolvedValue(syncedGame),
        },
        userGame: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce(targetGame) // find-or-create: target exists
            .mockResolvedValueOnce(originalGame), // delete check: original is not manually mapped
          findUniqueOrThrow: jest.fn().mockResolvedValue(originalGame), // merge: load original
          update: jest
            .fn()
            .mockResolvedValueOnce(targetGameAfterPlaytimeUpdate) // playtime merge update (only called when source > target)
            .mockResolvedValueOnce(targetGameAfterPlaytimeUpdate), // isMappedManually update
          delete: jest.fn().mockResolvedValue({}),
        },
        userGamePlatform: {
          update: jest.fn().mockResolvedValue({}), // move platform link
          count: jest.fn().mockResolvedValue(0), // no remaining links → original gets cleaned up
        },
      };
    }

    beforeEach(() => {
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbGame);
    });

    it('keeps higher playtime of target game when remapping source to a game with more hours', async () => {
      // Source (Xbox): 1h. Target (PSN): 3h. Expected result: 3h (target wins).
      const tx = buildTx({ originalPlaytime: 1, targetPlaytime: 3 });
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(tx));

      // findOne after transaction
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(
        makePrismaGame({ id: TARGET_GAME_ID, playtimeHours: 3, igdbGame }),
      );

      const result = await service.remap('user-1', ORIGINAL_GAME_ID, remapDtoWithExternalId);

      // playtime update must NOT have been called — target already has the higher value
      const updateCalls: Array<Record<string, unknown>> = (tx.userGame.update as jest.Mock).mock.calls.map(
        (c: [Record<string, unknown>]) => c[0],
      );
      const playtimeUpdateCall = updateCalls.find((c) => c.data && (c.data as Record<string, unknown>).playtimeHours !== undefined);
      expect(playtimeUpdateCall).toBeUndefined();

      expect(result.playtimeHours).toBe(3);
    });

    it('keeps higher playtime of source game when remapping to a game with fewer hours', async () => {
      // Source (Xbox): 5h. Target (PSN): 3h. Expected result: 5h (source wins).
      const tx = buildTx({
        originalPlaytime: 5,
        targetPlaytime: 3,
        updatedTargetGame: { playtimeHours: 5 },
      });
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(tx));

      // findOne after transaction
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(
        makePrismaGame({ id: TARGET_GAME_ID, playtimeHours: 5, igdbGame }),
      );

      const result = await service.remap('user-1', ORIGINAL_GAME_ID, remapDtoWithExternalId);

      // playtime update MUST have been called with the source's higher value
      const updateCalls: Array<Record<string, unknown>> = (tx.userGame.update as jest.Mock).mock.calls.map(
        (c: [Record<string, unknown>]) => c[0],
      );
      const playtimeUpdateCall = updateCalls.find((c) => c.data && (c.data as Record<string, unknown>).playtimeHours !== undefined);
      expect(playtimeUpdateCall).toBeDefined();
      expect((playtimeUpdateCall!.data as Record<string, unknown>).playtimeHours).toBe(5);

      expect(result.playtimeHours).toBe(5);
    });

    it('keeps target rating if set, falls back to source rating if target has none', async () => {
      // Target has a rating set — it must be preserved.
      const txWithTargetRating = buildTx({
        originalPlaytime: 1,
        targetPlaytime: 1,
        originalOverrides: { userRating: 7 },
        targetOverrides: { userRating: 9 },
      });
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(txWithTargetRating));
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(
        makePrismaGame({ id: TARGET_GAME_ID, userRating: 9, igdbGame }),
      );

      const resultWithTargetRating = await service.remap('user-1', ORIGINAL_GAME_ID, remapDtoWithExternalId);
      expect(resultWithTargetRating.userRating).toBe(9);

      jest.clearAllMocks();
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbGame);

      // Target has no rating — source rating must be adopted.
      const txWithSourceRating = buildTx({
        originalPlaytime: 1,
        targetPlaytime: 1,
        originalOverrides: { userRating: 6 },
        targetOverrides: { userRating: null, updatedTargetGame: { userRating: 6 } },
      });
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(txWithSourceRating));
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(
        makePrismaGame({ id: TARGET_GAME_ID, userRating: 6, igdbGame }),
      );

      const resultWithSourceRating = await service.remap('user-1', ORIGINAL_GAME_ID, remapDtoWithExternalId);
      const updateCalls: Array<Record<string, unknown>> = (txWithSourceRating.userGame.update as jest.Mock).mock.calls.map(
        (c: [Record<string, unknown>]) => c[0],
      );
      const ratingUpdateCall = updateCalls.find((c) => c.data && (c.data as Record<string, unknown>).userRating !== undefined);
      expect(ratingUpdateCall).toBeDefined();
      expect((ratingUpdateCall!.data as Record<string, unknown>).userRating).toBe(6);
      expect(resultWithSourceRating.userRating).toBe(6);
    });

    it('keeps target notes if set, falls back to source notes if target has none', async () => {
      // Target has notes set — they must be preserved.
      const txWithTargetNotes = buildTx({
        originalPlaytime: 1,
        targetPlaytime: 1,
        originalOverrides: { notes: 'source notes' },
        targetOverrides: { notes: 'target notes' },
      });
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(txWithTargetNotes));
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(
        makePrismaGame({ id: TARGET_GAME_ID, notes: 'target notes', igdbGame }),
      );

      const resultWithTargetNotes = await service.remap('user-1', ORIGINAL_GAME_ID, remapDtoWithExternalId);
      expect(resultWithTargetNotes.notes).toBe('target notes');

      jest.clearAllMocks();
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(igdbGame);

      // Target has no notes — source notes must be adopted.
      const txWithSourceNotes = buildTx({
        originalPlaytime: 1,
        targetPlaytime: 1,
        originalOverrides: { notes: 'source notes' },
        targetOverrides: { notes: null, updatedTargetGame: { notes: 'source notes' } },
      });
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(txWithSourceNotes));
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(
        makePrismaGame({ id: TARGET_GAME_ID, notes: 'source notes', igdbGame }),
      );

      const resultWithSourceNotes = await service.remap('user-1', ORIGINAL_GAME_ID, remapDtoWithExternalId);
      const updateCalls: Array<Record<string, unknown>> = (txWithSourceNotes.userGame.update as jest.Mock).mock.calls.map(
        (c: [Record<string, unknown>]) => c[0],
      );
      const notesUpdateCall = updateCalls.find((c) => c.data && (c.data as Record<string, unknown>).notes !== undefined);
      expect(notesUpdateCall).toBeDefined();
      expect((notesUpdateCall!.data as Record<string, unknown>).notes).toBe('source notes');
      expect(resultWithSourceNotes.notes).toBe('source notes');
    });

    it('merges moods from both source and target', async () => {
      const tx = buildTx({
        originalPlaytime: 1,
        targetPlaytime: 1,
        originalOverrides: { moods: ['focused', 'excited'] },
        targetOverrides: { moods: ['relaxed', 'focused'] },
        updatedTargetGame: { moods: ['focused', 'excited', 'relaxed'] },
      });
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(tx));
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(
        makePrismaGame({ id: TARGET_GAME_ID, moods: ['focused', 'excited', 'relaxed'], igdbGame }),
      );

      const result = await service.remap('user-1', ORIGINAL_GAME_ID, remapDtoWithExternalId);

      const updateCalls: Array<Record<string, unknown>> = (tx.userGame.update as jest.Mock).mock.calls.map(
        (c: [Record<string, unknown>]) => c[0],
      );
      const moodsUpdateCall = updateCalls.find((c) => c.data && (c.data as Record<string, unknown>).moods !== undefined);
      expect(moodsUpdateCall).toBeDefined();
      const mergedMoods = (moodsUpdateCall!.data as Record<string, unknown>).moods as string[];
      expect(mergedMoods).toHaveLength(3);
      expect(mergedMoods).toEqual(expect.arrayContaining(['focused', 'excited', 'relaxed']));
      expect(result.moods).toEqual(expect.arrayContaining(['focused', 'excited', 'relaxed']));
    });
  });

  // ---------------------------------------------------------------------------
  // remove — tombstone creation
  // ---------------------------------------------------------------------------

  describe('remove — tombstone creation', () => {
    beforeEach(() => {
      (prisma.unmappedSyncedGame.upsert as jest.Mock).mockResolvedValue({});
    });

    it('writes a USER_DELETED tombstone for each platform link when game is deleted', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame());
      (prisma.userGame.delete as jest.Mock).mockResolvedValue({});
      (prisma.userGamePlatform.findMany as jest.Mock).mockResolvedValue([
        { syncedGameId: 'synced-1' },
        { syncedGameId: 'synced-2' },
      ]);

      await service.remove('user-1', 'game-1');

      expect(prisma.unmappedSyncedGame.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.unmappedSyncedGame.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_syncedGameId: { userId: 'user-1', syncedGameId: 'synced-1' } },
          create: expect.objectContaining({ reason: UnmappedReason.USER_DELETED, userId: 'user-1', syncedGameId: 'synced-1' }),
          update: { reason: UnmappedReason.USER_DELETED },
        }),
      );
      expect(prisma.unmappedSyncedGame.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_syncedGameId: { userId: 'user-1', syncedGameId: 'synced-2' } },
          create: expect.objectContaining({ reason: UnmappedReason.USER_DELETED, userId: 'user-1', syncedGameId: 'synced-2' }),
          update: { reason: UnmappedReason.USER_DELETED },
        }),
      );
    });

    it('does not write any tombstone when the deleted game has no platform links', async () => {
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame());
      (prisma.userGame.delete as jest.Mock).mockResolvedValue({});
      (prisma.userGamePlatform.findMany as jest.Mock).mockResolvedValue([]);

      await service.remove('user-1', 'game-1');

      expect(prisma.unmappedSyncedGame.upsert).not.toHaveBeenCalled();
    });
  });
});
