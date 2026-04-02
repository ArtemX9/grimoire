import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { GameStatus } from '@grimoire/shared';

import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GameResponse, GameStatsResponse } from './games.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeGameResponse(overrides: Partial<GameResponse> = {}): GameResponse {
  return {
    id: 'game-1',
    userId: 'user-1',
    igdbId: 12345,
    title: 'The Witcher 3',
    genres: ['RPG'],
    status: 'PLAYING',
    playtimeHours: 42,
    moods: ['focused'],
    addedAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
    ...overrides,
  };
}

function makeUser(id = 'user-1') {
  return { id, email: `${id}@example.com`, name: 'Test User', role: 'USER', plan: 'FREE' };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('GamesController', () => {
  let controller: GamesController;
  let gamesService: jest.Mocked<GamesService>;

  beforeEach(async () => {
    const mockGamesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        { provide: GamesService, useValue: mockGamesService },
      ],
    }).compile();

    controller = module.get<GamesController>(GamesController);
    gamesService = module.get(GamesService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------

  describe('findAll', () => {
    it('delegates to gamesService.findAll with the user id', async () => {
      const user = makeUser();
      const games = [makeGameResponse()];
      gamesService.findAll.mockResolvedValue(games);

      const result = await controller.findAll(user);

      expect(gamesService.findAll).toHaveBeenCalledWith('user-1', undefined);
      expect(result).toBe(games);
    });

    it('forwards the optional status query param to the service', async () => {
      const user = makeUser();
      gamesService.findAll.mockResolvedValue([]);

      await controller.findAll(user, GameStatus.COMPLETED);

      expect(gamesService.findAll).toHaveBeenCalledWith('user-1', GameStatus.COMPLETED);
    });

    it('returns the service result directly', async () => {
      const user = makeUser();
      const games = [makeGameResponse({ id: 'game-1' }), makeGameResponse({ id: 'game-2' })];
      gamesService.findAll.mockResolvedValue(games);

      const result = await controller.findAll(user);

      expect(result).toHaveLength(2);
      expect(result).toBe(games);
    });

    it('uses the id from the current user — not any other source', async () => {
      const user = makeUser('user-99');
      gamesService.findAll.mockResolvedValue([]);

      await controller.findAll(user);

      expect(gamesService.findAll).toHaveBeenCalledWith('user-99', undefined);
    });
  });

  // ---------------------------------------------------------------------------
  // getStats
  // ---------------------------------------------------------------------------

  describe('getStats', () => {
    it('delegates to gamesService.getStats with the user id', async () => {
      const user = makeUser();
      const stats: GameStatsResponse = { total: 10, byStatus: [], totalHours: 100 };
      gamesService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(user);

      expect(gamesService.getStats).toHaveBeenCalledWith('user-1');
      expect(result).toBe(stats);
    });

    it('returns the stats from the service directly', async () => {
      const user = makeUser();
      const stats: GameStatsResponse = {
        total: 5,
        byStatus: [{ status: 'PLAYING', _count: 3 }],
        totalHours: 42,
      };
      gamesService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(user);

      expect(result).toEqual(stats);
    });

    it('uses the id from the current user — not any other source', async () => {
      const user = makeUser('user-77');
      gamesService.getStats.mockResolvedValue({ total: 0, byStatus: [], totalHours: 0 });

      await controller.getStats(user);

      expect(gamesService.getStats).toHaveBeenCalledWith('user-77');
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------

  describe('findOne', () => {
    it('delegates to gamesService.findOne with the user id and game id', async () => {
      const user = makeUser();
      const game = makeGameResponse();
      gamesService.findOne.mockResolvedValue(game);

      const result = await controller.findOne(user, 'game-1');

      expect(gamesService.findOne).toHaveBeenCalledWith('user-1', 'game-1');
      expect(result).toBe(game);
    });

    it('propagates NotFoundException from the service when the game is not found', async () => {
      const user = makeUser();
      gamesService.findOne.mockRejectedValue(new NotFoundException('Game not found'));

      await expect(controller.findOne(user, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('propagates NotFoundException when the game belongs to a different user', async () => {
      // The service enforces ownership — it throws NotFoundException for cross-user access
      const user = makeUser('user-2');
      gamesService.findOne.mockRejectedValue(new NotFoundException('Game not found'));

      await expect(controller.findOne(user, 'game-1')).rejects.toThrow(NotFoundException);
      expect(gamesService.findOne).toHaveBeenCalledWith('user-2', 'game-1');
    });

    it('uses the id from the current user — not any other source', async () => {
      const user = makeUser('user-55');
      gamesService.findOne.mockResolvedValue(makeGameResponse());

      await controller.findOne(user, 'game-1');

      expect(gamesService.findOne).toHaveBeenCalledWith('user-55', 'game-1');
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    const body = {
      igdbId: 12345,
      title: 'The Witcher 3',
      genres: ['RPG'],
      status: GameStatus.BACKLOG,
      moods: [] as string[],
    };

    it('delegates to gamesService.create with the user id and validated body', async () => {
      const user = makeUser();
      const created = makeGameResponse({ status: GameStatus.BACKLOG });
      gamesService.create.mockResolvedValue(created);

      const result = await controller.create(user, body);

      expect(gamesService.create).toHaveBeenCalledWith('user-1', body);
      expect(result).toBe(created);
    });

    it('returns the created game from the service directly', async () => {
      const user = makeUser();
      const created = makeGameResponse({ id: 'game-new' });
      gamesService.create.mockResolvedValue(created);

      const result = await controller.create(user, body);

      expect(result.id).toBe('game-new');
    });

    it('uses the id from the current user — not any other source', async () => {
      const user = makeUser('user-88');
      gamesService.create.mockResolvedValue(makeGameResponse());

      await controller.create(user, body);

      expect(gamesService.create).toHaveBeenCalledWith('user-88', body);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe('update', () => {
    const body = { status: GameStatus.COMPLETED, playtimeHours: 100 };

    it('delegates to gamesService.update with user id, game id, and body', async () => {
      const user = makeUser();
      const updated = makeGameResponse({ status: 'COMPLETED', playtimeHours: 100 });
      gamesService.update.mockResolvedValue(updated);

      const result = await controller.update(user, 'game-1', body);

      expect(gamesService.update).toHaveBeenCalledWith('user-1', 'game-1', body);
      expect(result).toBe(updated);
    });

    it('propagates NotFoundException from the service when the game is not found', async () => {
      const user = makeUser();
      gamesService.update.mockRejectedValue(new NotFoundException('Game not found'));

      await expect(controller.update(user, 'nonexistent', body)).rejects.toThrow(NotFoundException);
    });

    it('propagates NotFoundException when trying to update another user\'s game', async () => {
      const user = makeUser('user-2');
      gamesService.update.mockRejectedValue(new NotFoundException('Game not found'));

      await expect(controller.update(user, 'game-1', body)).rejects.toThrow(NotFoundException);
      expect(gamesService.update).toHaveBeenCalledWith('user-2', 'game-1', body);
    });

    it('uses the id from the current user — not any other source', async () => {
      const user = makeUser('user-66');
      gamesService.update.mockResolvedValue(makeGameResponse());

      await controller.update(user, 'game-1', body);

      expect(gamesService.update).toHaveBeenCalledWith('user-66', 'game-1', body);
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------

  describe('remove', () => {
    it('delegates to gamesService.remove with the user id and game id', async () => {
      const user = makeUser();
      gamesService.remove.mockResolvedValue(undefined);

      await controller.remove(user, 'game-1');

      expect(gamesService.remove).toHaveBeenCalledWith('user-1', 'game-1');
    });

    it('propagates NotFoundException from the service when the game is not found', async () => {
      const user = makeUser();
      gamesService.remove.mockRejectedValue(new NotFoundException('Game not found'));

      await expect(controller.remove(user, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('propagates NotFoundException when trying to delete another user\'s game', async () => {
      const user = makeUser('user-2');
      gamesService.remove.mockRejectedValue(new NotFoundException('Game not found'));

      await expect(controller.remove(user, 'game-1')).rejects.toThrow(NotFoundException);
      expect(gamesService.remove).toHaveBeenCalledWith('user-2', 'game-1');
    });

    it('uses the id from the current user — not any other source', async () => {
      const user = makeUser('user-33');
      gamesService.remove.mockResolvedValue(undefined);

      await controller.remove(user, 'game-1');

      expect(gamesService.remove).toHaveBeenCalledWith('user-33', 'game-1');
    });

    it('resolves without a value on success', async () => {
      const user = makeUser();
      gamesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(user, 'game-1');

      expect(result).toBeUndefined();
    });
  });
});
