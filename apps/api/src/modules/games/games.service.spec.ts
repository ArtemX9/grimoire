import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { GameStatus } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { GamesService } from './games.service';
import { GameResponse, GameStatsResponse } from './games.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePrismaGame(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'game-1',
    userId: 'user-1',
    igdbId: 12345,
    steamAppId: null,
    title: 'The Witcher 3',
    coverUrl: null,
    genres: ['RPG', 'Open World'],
    status: 'PLAYING',
    playtimeHours: 42,
    userRating: null,
    notes: null,
    moods: ['focused'],
    addedAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
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
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
              aggregate: jest.fn(),
            },
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
    it('returns all games for the user ordered by updatedAt desc', async () => {
      const rows = [
        makePrismaGame({ id: 'game-2', updatedAt: new Date('2024-07-01T00:00:00Z') }),
        makePrismaGame({ id: 'game-1', updatedAt: new Date('2024-06-01T00:00:00Z') }),
      ];
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue(rows);

      const result = await service.findAll('user-1');

      expect(prisma.userGame.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('game-2');
    });

    it('passes the status filter when one is provided', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1', GameStatus.PLAYING);

      expect(prisma.userGame.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: GameStatus.PLAYING },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('omits the status clause when no status is provided', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-1');

      const call = (prisma.userGame.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).not.toHaveProperty('status');
    });

    it('returns an empty array when the user has no games', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll('user-1');

      expect(result).toEqual([]);
    });

    it('scopes the query to the requesting user — never leaks another user\'s games', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('user-2');

      expect(prisma.userGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-2' }) }),
      );
    });

    it('maps null optional fields to undefined in every response item', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([
        makePrismaGame({ steamAppId: null, coverUrl: null, userRating: null, notes: null }),
      ]);

      const [result] = await service.findAll('user-1');

      expect(result.steamAppId).toBeUndefined();
      expect(result.coverUrl).toBeUndefined();
      expect(result.userRating).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('maps populated optional fields through correctly', async () => {
      (prisma.userGame.findMany as jest.Mock).mockResolvedValue([
        makePrismaGame({ steamAppId: 730, coverUrl: 'https://img.example.com/cover.jpg', userRating: 9, notes: 'Great!' }),
      ]);

      const [result] = await service.findAll('user-1');

      expect(result.steamAppId).toBe(730);
      expect(result.coverUrl).toBe('https://img.example.com/cover.jpg');
      expect(result.userRating).toBe(9);
      expect(result.notes).toBe('Great!');
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------

  describe('findOne', () => {
    it('returns the game when it belongs to the requesting user', async () => {
      const row = makePrismaGame();
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(row);

      const result = await service.findOne('user-1', 'game-1');

      expect(prisma.userGame.findFirst).toHaveBeenCalledWith({
        where: { id: 'game-1', userId: 'user-1' },
      });
      expect(result.id).toBe('game-1');
      expect(result.title).toBe('The Witcher 3');
    });

    it('throws NotFoundException when the game does not exist', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the game belongs to a different user', async () => {
      // Prisma returns null because the where clause includes userId — ownership is enforced at query level
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('user-2', 'game-1')).rejects.toThrow(NotFoundException);
      expect(prisma.userGame.findFirst).toHaveBeenCalledWith({
        where: { id: 'game-1', userId: 'user-2' },
      });
    });

    it('throws NotFoundException with the message "Game not found"', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('user-1', 'game-1')).rejects.toThrow('Game not found');
    });

    it('maps null optional fields to undefined in the response', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(
        makePrismaGame({ steamAppId: null, coverUrl: null, userRating: null, notes: null }),
      );

      const result = await service.findOne('user-1', 'game-1');

      expect(result.steamAppId).toBeUndefined();
      expect(result.coverUrl).toBeUndefined();
      expect(result.userRating).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('includes all required fields in the response', async () => {
      const row = makePrismaGame({
        steamAppId: 570,
        coverUrl: 'https://example.com/cover.png',
        userRating: 8,
        notes: 'Brilliant',
      });
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(row);

      const result = await service.findOne('user-1', 'game-1');

      expect(result).toMatchObject<Partial<GameResponse>>({
        id: 'game-1',
        userId: 'user-1',
        igdbId: 12345,
        steamAppId: 570,
        title: 'The Witcher 3',
        coverUrl: 'https://example.com/cover.png',
        genres: ['RPG', 'Open World'],
        status: 'PLAYING',
        playtimeHours: 42,
        userRating: 8,
        notes: 'Brilliant',
        moods: ['focused'],
      });
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    const dto = {
      igdbId: 12345,
      title: 'The Witcher 3',
      genres: ['RPG'],
      status: GameStatus.BACKLOG,
      moods: [] as string[],
    };

    it('creates a game with the correct userId and dto data', async () => {
      const created = makePrismaGame({ status: GameStatus.BACKLOG });
      (prisma.userGame.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(prisma.userGame.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
      expect(result.id).toBe('game-1');
    });

    it('returns a mapped response — not the raw Prisma object', async () => {
      const created = makePrismaGame();
      (prisma.userGame.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      // Raw Prisma object has null for optional fields; response must have undefined
      expect(result.steamAppId).toBeUndefined();
      expect(result.coverUrl).toBeUndefined();
      expect(result.userRating).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('preserves all fields provided in the dto', async () => {
      const fullDto = {
        igdbId: 730,
        steamAppId: 730,
        title: 'CS:GO',
        coverUrl: 'https://example.com/csgo.jpg',
        genres: ['FPS'],
        status: GameStatus.PLAYING,
        moods: ['competitive'],
        notes: 'My favourite',
      };
      const created = makePrismaGame({ ...fullDto });
      (prisma.userGame.create as jest.Mock).mockResolvedValue(created);

      await service.create('user-1', fullDto);

      expect(prisma.userGame.create).toHaveBeenCalledWith({
        data: { ...fullDto, userId: 'user-1' },
      });
    });

    it('injects the caller userId — never uses a userId from the dto', async () => {
      const created = makePrismaGame();
      (prisma.userGame.create as jest.Mock).mockResolvedValue(created);

      await service.create('user-99', dto);

      const callArg = (prisma.userGame.create as jest.Mock).mock.calls[0][0];
      expect(callArg.data.userId).toBe('user-99');
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe('update', () => {
    const dto = { status: GameStatus.COMPLETED, playtimeHours: 100 };

    it('updates the game when it belongs to the requesting user', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(makePrismaGame());
      const updated = makePrismaGame({ status: 'COMPLETED', playtimeHours: 100 });
      (prisma.userGame.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update('user-1', 'game-1', dto);

      expect(prisma.userGame.update).toHaveBeenCalledWith({
        where: { id: 'game-1' },
        data: dto,
      });
      expect(result.status).toBe('COMPLETED');
      expect(result.playtimeHours).toBe(100);
    });

    it('throws NotFoundException when the game does not exist', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update('user-1', 'nonexistent', dto)).rejects.toThrow(NotFoundException);
      expect(prisma.userGame.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException — not updating — when the game belongs to a different user', async () => {
      // findFirst returns null because the where clause includes userId
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update('user-2', 'game-1', dto)).rejects.toThrow(NotFoundException);
      expect(prisma.userGame.update).not.toHaveBeenCalled();
    });

    it('performs the ownership check with the correct userId and gameId', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(makePrismaGame());
      (prisma.userGame.update as jest.Mock).mockResolvedValue(makePrismaGame());

      await service.update('user-1', 'game-1', dto);

      expect(prisma.userGame.findFirst).toHaveBeenCalledWith({
        where: { id: 'game-1', userId: 'user-1' },
      });
    });

    it('maps null optional fields to undefined after updating', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(makePrismaGame());
      (prisma.userGame.update as jest.Mock).mockResolvedValue(
        makePrismaGame({ steamAppId: null, coverUrl: null, userRating: null, notes: null }),
      );

      const result = await service.update('user-1', 'game-1', dto);

      expect(result.steamAppId).toBeUndefined();
      expect(result.coverUrl).toBeUndefined();
      expect(result.userRating).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('returns a mapped response with the updated data', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(makePrismaGame());
      const updated = makePrismaGame({ status: 'DROPPED', userRating: 5, notes: 'Not for me' });
      (prisma.userGame.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update('user-1', 'game-1', { status: GameStatus.DROPPED, userRating: 5, notes: 'Not for me' });

      expect(result.status).toBe(GameStatus.DROPPED);
      expect(result.userRating).toBe(5);
      expect(result.notes).toBe('Not for me');
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------

  describe('remove', () => {
    it('deletes the game when it belongs to the requesting user', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(makePrismaGame());
      (prisma.userGame.delete as jest.Mock).mockResolvedValue({});

      await expect(service.remove('user-1', 'game-1')).resolves.toBeUndefined();
      expect(prisma.userGame.delete).toHaveBeenCalledWith({ where: { id: 'game-1' } });
    });

    it('throws NotFoundException when the game does not exist', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.userGame.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException — not deleting — when the game belongs to a different user', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('user-2', 'game-1')).rejects.toThrow(NotFoundException);
      expect(prisma.userGame.delete).not.toHaveBeenCalled();
    });

    it('performs the ownership check with the correct userId and gameId', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(makePrismaGame());
      (prisma.userGame.delete as jest.Mock).mockResolvedValue({});

      await service.remove('user-1', 'game-1');

      expect(prisma.userGame.findFirst).toHaveBeenCalledWith({
        where: { id: 'game-1', userId: 'user-1' },
      });
    });

    it('throws NotFoundException with the message "Game not found"', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('user-1', 'game-1')).rejects.toThrow('Game not found');
    });

    it('resolves with undefined (void) on success', async () => {
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(makePrismaGame());
      (prisma.userGame.delete as jest.Mock).mockResolvedValue({});

      const result = await service.remove('user-1', 'game-1');

      expect(result).toBeUndefined();
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
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({
        _sum: { playtimeHours: 250 },
      });

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

    it('runs count, groupBy, and aggregate in parallel via Promise.all', async () => {
      let countCalled = false;
      let groupByCalled = false;
      let aggregateCalled = false;

      (prisma.userGame.count as jest.Mock).mockImplementation(() => {
        countCalled = true;
        return Promise.resolve(0);
      });
      (prisma.userGame.groupBy as jest.Mock).mockImplementation(() => {
        groupByCalled = true;
        return Promise.resolve([]);
      });
      (prisma.userGame.aggregate as jest.Mock).mockImplementation(() => {
        aggregateCalled = true;
        return Promise.resolve({ _sum: { playtimeHours: null } });
      });

      await service.getStats('user-1');

      expect(countCalled).toBe(true);
      expect(groupByCalled).toBe(true);
      expect(aggregateCalled).toBe(true);
    });

    it('scopes all three queries to the requesting userId', async () => {
      (prisma.userGame.count as jest.Mock).mockResolvedValue(0);
      (prisma.userGame.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({ _sum: { playtimeHours: null } });

      await service.getStats('user-42');

      expect(prisma.userGame.count).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-42' } }));
      expect(prisma.userGame.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-42' } }));
      expect(prisma.userGame.aggregate).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-42' } }));
    });

    it('returns 0 for totalHours when aggregate sum is null (no games with playtime)', async () => {
      (prisma.userGame.count as jest.Mock).mockResolvedValue(0);
      (prisma.userGame.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({ _sum: { playtimeHours: null } });

      const result = await service.getStats('user-1');

      expect(result.totalHours).toBe(0);
    });

    it('returns an empty byStatus array when the user has no games', async () => {
      (prisma.userGame.count as jest.Mock).mockResolvedValue(0);
      (prisma.userGame.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({ _sum: { playtimeHours: null } });

      const result = await service.getStats('user-1');

      expect(result.byStatus).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalHours).toBe(0);
    });

    it('uses the correct groupBy fields and count for the status breakdown', async () => {
      (prisma.userGame.count as jest.Mock).mockResolvedValue(0);
      (prisma.userGame.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({ _sum: { playtimeHours: null } });

      await service.getStats('user-1');

      expect(prisma.userGame.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ['status'], _count: true }),
      );
    });

    it('uses the correct aggregate sum field for total playtime', async () => {
      (prisma.userGame.count as jest.Mock).mockResolvedValue(0);
      (prisma.userGame.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.userGame.aggregate as jest.Mock).mockResolvedValue({ _sum: { playtimeHours: null } });

      await service.getStats('user-1');

      expect(prisma.userGame.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ _sum: { playtimeHours: true } }),
      );
    });
  });
});
