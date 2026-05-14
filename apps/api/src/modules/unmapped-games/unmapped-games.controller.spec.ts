import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Genre, MapUnmappedGameSchemaDto, Theme, UnmappedGame, UnmappedReasons } from '@grimoire/shared';

import { generateUnmappedSyncedGame, generateUser } from '../../test';
import { UnmappedGamesController } from './unmapped-games.controller';
import { UnmappedGamesService } from './unmapped-games.service';

const mapBody: MapUnmappedGameSchemaDto = {
  syncedGameID: 'synced-game-1',
  isMapped: false,
  platformID: 1,
  igdbInfo: {
    id: 12345,
    title: 'The Witcher 3',
    genres: [Genre.RPG],
    releaseDate: new Date('2015-05-19T00:00:00Z'),
    coverUrl: 'https://example.com/cover.jpg',
    summary: 'A story-driven RPG.',
    storyLine: 'Geralt hunts a monster.',
    themes: [Theme.Action],
  },
};

describe('UnmappedGamesController', () => {
  let controller: UnmappedGamesController;
  let unmappedGamesService: jest.Mocked<UnmappedGamesService>;

  beforeEach(async () => {
    const mockUnmappedGamesService = {
      getUnmappedGamesForUser: jest.fn(),
      mapGameForUser: jest.fn(),
      deleteGame: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnmappedGamesController],
      providers: [{ provide: UnmappedGamesService, useValue: mockUnmappedGamesService }],
    }).compile();

    controller = module.get<UnmappedGamesController>(UnmappedGamesController);
    unmappedGamesService = module.get(UnmappedGamesService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getUnmappedGamesForUser
  // ---------------------------------------------------------------------------

  describe('getUnmappedGamesForUser', () => {
    it('delegates to unmappedGamesService.getUnmappedGamesForUser with the user id', async () => {
      const user = generateUser({ id: 'user-1' });
      const unmappedGames: UnmappedGame[] = [];
      unmappedGamesService.getUnmappedGamesForUser.mockResolvedValue(unmappedGames);

      const result = await controller.getUnmappedGamesForUser(user, undefined, undefined);

      expect(unmappedGamesService.getUnmappedGamesForUser).toHaveBeenCalledWith('user-1', undefined, undefined);
      expect(result).toBe(unmappedGames);
    });

    it('forwards the optional limit query param to the service', async () => {
      const user = generateUser({ id: 'user-1' });
      unmappedGamesService.getUnmappedGamesForUser.mockResolvedValue([]);

      await controller.getUnmappedGamesForUser(user, 10, undefined);

      expect(unmappedGamesService.getUnmappedGamesForUser).toHaveBeenCalledWith('user-1', 10, undefined);
    });

    it('forwards the optional offset query param to the service', async () => {
      const user = generateUser({ id: 'user-1' });
      unmappedGamesService.getUnmappedGamesForUser.mockResolvedValue([]);

      await controller.getUnmappedGamesForUser(user, undefined, 20);

      expect(unmappedGamesService.getUnmappedGamesForUser).toHaveBeenCalledWith('user-1', undefined, 20);
    });

    it('returns the service result directly', async () => {
      const user = generateUser({ id: 'user-1' });
      const raw = generateUnmappedSyncedGame({ userId: 'user-1' });
      const unmappedGame: UnmappedGame = {
        id: raw.id,
        syncedGameID: raw.syncedGameId,
        playtimeHours: raw.playtimeHours,
        isMapped: raw.isMapped,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        reason: UnmappedReasons.NO_MATCH,
        platform: { id: 1, platform: 'STEAM' } as UnmappedGame['platform'],
        syncedGameTitle: raw.syncedGame.externalTitle,
      };
      const games = [unmappedGame];
      unmappedGamesService.getUnmappedGamesForUser.mockResolvedValue(games);

      const result = await controller.getUnmappedGamesForUser(user, undefined, undefined);

      expect(result).toHaveLength(1);
      expect(result).toBe(games);
    });

    it('uses the id from the current user — not any other source', async () => {
      const user = generateUser({ id: 'user-99' });
      unmappedGamesService.getUnmappedGamesForUser.mockResolvedValue([]);

      await controller.getUnmappedGamesForUser(user, undefined, undefined);

      expect(unmappedGamesService.getUnmappedGamesForUser).toHaveBeenCalledWith('user-99', undefined, undefined);
    });
  });

  // ---------------------------------------------------------------------------
  // mapGameForUser
  // ---------------------------------------------------------------------------

  describe('mapGameForUser', () => {
    it('delegates to unmappedGamesService.mapGameForUser with user id, route param, and body', async () => {
      const user = generateUser({ id: 'user-1' });
      unmappedGamesService.mapGameForUser.mockResolvedValue(undefined);

      const result = await controller.mapGameForUser(user, 'unmapped-1', mapBody);

      expect(unmappedGamesService.mapGameForUser).toHaveBeenCalledWith('user-1', 'unmapped-1', mapBody);
      expect(result).toBeUndefined();
    });

    it('returns the service result directly', async () => {
      const user = generateUser({ id: 'user-1' });
      unmappedGamesService.mapGameForUser.mockResolvedValue(undefined);

      const result = await controller.mapGameForUser(user, 'unmapped-1', mapBody);

      expect(result).toBeUndefined();
    });

    it('propagates NotFoundException from the service when the unmapped game is not found', async () => {
      const user = generateUser({ id: 'user-1' });
      unmappedGamesService.mapGameForUser.mockRejectedValue(new NotFoundException('Unmapped game not found'));

      await expect(controller.mapGameForUser(user, 'nonexistent', mapBody)).rejects.toThrow(NotFoundException);
    });

    it('uses the id from the current user — not any other source', async () => {
      const user = generateUser({ id: 'user-88' });
      unmappedGamesService.mapGameForUser.mockResolvedValue(undefined);

      await controller.mapGameForUser(user, 'unmapped-1', mapBody);

      expect(unmappedGamesService.mapGameForUser).toHaveBeenCalledWith('user-88', 'unmapped-1', mapBody);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteGame
  // ---------------------------------------------------------------------------

  describe('deleteGame', () => {
    it('delegates to unmappedGamesService.deleteGame with the user id and route param id', async () => {
      const user = generateUser({ id: 'user-1' });
      unmappedGamesService.deleteGame.mockResolvedValue(undefined);

      await controller.deleteGame(user, 'unmapped-1');

      expect(unmappedGamesService.deleteGame).toHaveBeenCalledWith('user-1', 'unmapped-1');
    });

    it('returns the service result directly', async () => {
      const user = generateUser({ id: 'user-1' });
      unmappedGamesService.deleteGame.mockResolvedValue(undefined);

      const result = await controller.deleteGame(user, 'unmapped-1');

      expect(result).toBeUndefined();
    });

    it('propagates NotFoundException from the service when the unmapped game is not found', async () => {
      const user = generateUser({ id: 'user-1' });
      unmappedGamesService.deleteGame.mockRejectedValue(new NotFoundException('Unmapped game not found'));

      await expect(controller.deleteGame(user, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it("propagates NotFoundException when trying to delete another user's unmapped game", async () => {
      const user = generateUser({ id: 'user-2' });
      unmappedGamesService.deleteGame.mockRejectedValue(new NotFoundException('Unmapped game not found'));

      await expect(controller.deleteGame(user, 'unmapped-1')).rejects.toThrow(NotFoundException);
      expect(unmappedGamesService.deleteGame).toHaveBeenCalledWith('user-2', 'unmapped-1');
    });

    it('uses the id from the current user — not any other source', async () => {
      const user = generateUser({ id: 'user-33' });
      unmappedGamesService.deleteGame.mockResolvedValue(undefined);

      await controller.deleteGame(user, 'unmapped-1');

      expect(unmappedGamesService.deleteGame).toHaveBeenCalledWith('user-33', 'unmapped-1');
    });
  });
});
