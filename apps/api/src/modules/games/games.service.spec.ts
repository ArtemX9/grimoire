import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { GameStatus, Genre, Mood } from '@grimoire/shared';

import { UnmappedReason } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
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
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([
        makePrismaGame({ userRating: null, notes: null }),
      ]);

      const [result] = await service.findAll('user-1');

      expect(result.userRating).toBeUndefined();
      expect(result.notes).toBeUndefined();
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
    };

    it('upserts IGDBGame by igdbId', async () => {
      (prisma.iGDBGame.upsert as jest.Mock).mockResolvedValue(makeIgdbGame());
      (prisma.userGame.create as jest.Mock).mockResolvedValue(makePrismaGame());

      await service.addManually('user-1', dto);

      expect(prisma.iGDBGame.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { igdbId: dto.igdbId } }),
      );
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

      expect(prisma.userGame.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'game-1', userId: 'user-1' } }),
      );
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
      (prisma.userGame.update as jest.Mock).mockResolvedValue(
        makePrismaGame({ userRating: null, notes: null }),
      );

      const result = await service.update('user-1', 'game-1', dto);

      expect(result.userRating).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------

  describe('remove', () => {
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

      expect(prisma.userGame.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ['status'], _count: true }),
      );
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

      expect(prisma.userGame.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { playtimeHours: 100 } }),
      );
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

    it('returns existing game without update when playtime is equal', async () => {
      (prisma.userGamePlatform.findFirst as jest.Mock).mockResolvedValue(
        makeUserGamePlatformRecord({ userGame: { isMappedManually: false, playtimeHours: 100 } }),
      );
      (prisma.userGame.findUnique as jest.Mock).mockResolvedValue(makePrismaGame({ playtimeHours: 100 }));

      await service.ingestFromSync('user-1', { ...syncedGameInfo, playtimeHours: 100 }, igdbInfo);

      expect(prisma.userGame.update).not.toHaveBeenCalled();
      expect(prisma.userGame.findUnique).toHaveBeenCalled();
    });
  });
});
