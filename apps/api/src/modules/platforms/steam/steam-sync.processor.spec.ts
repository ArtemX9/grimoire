import { Test, TestingModule } from '@nestjs/testing';

import { Job } from 'bullmq';

import { Genre, GameStatus, Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { SteamSyncProcessor } from './steam-sync.processor';
import { SteamService } from './steam.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeJob(data: { userId: string; steamId: string }): Job<{ userId: string; steamId: string }> {
  return { data } as Job<{ userId: string; steamId: string }>;
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

function makeIgdbGame(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1942,
    name: 'The Witcher 3: Wild Hunt',
    cover: { url: '//images.igdb.com/cover.jpg' },
    genres: [Genre.RPG],
    summary: 'Open world RPG',
    ...overrides,
  };
}

function makeUserGame(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'game-row-1',
    userId: 'user-1',
    steamAppId: 292030,
    title: 'The Witcher 3: Wild Hunt',
    playtimeHours: 50,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SteamSyncProcessor', () => {
  let processor: SteamSyncProcessor;
  let steamService: { getOwnedGames: jest.Mock };
  let gamesService: { create: jest.Mock };
  let igdbService: { search: jest.Mock };
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    steamService = { getOwnedGames: jest.fn() };
    gamesService = { create: jest.fn() };
    igdbService = { search: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SteamSyncProcessor,
        { provide: SteamService, useValue: steamService },
        { provide: GamesService, useValue: gamesService },
        { provide: IgdbService, useValue: igdbService },
        {
          provide: PrismaService,
          useValue: {
            userGame: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            userPlatform: {
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    processor = module.get<SteamSyncProcessor>(SteamSyncProcessor);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Happy path — new games imported
  // ---------------------------------------------------------------------------

  describe('process (new games)', () => {
    it('imports a new game from IGDB when no matching userGame exists', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.create.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: '76561198000000001' }));

      expect(gamesService.create).toHaveBeenCalledWith('user-1', {
        igdbId: 1942,
        steamAppId: 292030,
        title: 'The Witcher 3: Wild Hunt',
        coverUrl: '//images.igdb.com/cover.jpg',
        genres: [Genre.RPG],
        status: GameStatus.BACKLOG,
        moods: [],
      });
    });

    it('searches IGDB with the Steam game name limited to 1 result', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame({ name: 'Halo Infinite' })]);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);
      igdbService.search.mockResolvedValue([makeIgdbGame({ name: 'Halo Infinite' })]);
      gamesService.create.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(igdbService.search).toHaveBeenCalledWith('Halo Infinite', 1);
    });

    it('handles a Steam game with no cover in the IGDB result (coverUrl undefined)', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);
      igdbService.search.mockResolvedValue([makeIgdbGame({ cover: undefined })]);
      gamesService.create.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(gamesService.create).toHaveBeenCalledWith('user-1', expect.objectContaining({ coverUrl: undefined }));
    });

    it('handles a Steam game with no genres in the IGDB result (genres defaults to [])', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);
      igdbService.search.mockResolvedValue([makeIgdbGame({ genres: undefined })]);
      gamesService.create.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(gamesService.create).toHaveBeenCalledWith('user-1', expect.objectContaining({ genres: [] }));
    });
  });

  // ---------------------------------------------------------------------------
  // Happy path — existing games updated
  // ---------------------------------------------------------------------------

  describe('process (existing games)', () => {
    it('updates playtimeHours for a game that already exists in the library', async () => {
      const existingGame = makeUserGame();
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame({ playtime_forever: 6000 })]);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(existingGame);
      (prisma.userGame.update as jest.Mock).mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(prisma.userGame.update).toHaveBeenCalledWith({
        where: { id: 'game-row-1' },
        data: { playtimeHours: 100 }, // 6000 / 60
      });
      expect(gamesService.create).not.toHaveBeenCalled();
      expect(igdbService.search).not.toHaveBeenCalled();
    });

    it('skips the IGDB lookup entirely when the game already exists', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(makeUserGame());
      (prisma.userGame.update as jest.Mock).mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(igdbService.search).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases — skipped games
  // ---------------------------------------------------------------------------

  describe('process (edge cases)', () => {
    it('skips a Steam game when IGDB returns no results for it', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);
      igdbService.search.mockResolvedValue([]); // no match
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(gamesService.create).not.toHaveBeenCalled();
    });

    it('does nothing when the owned games list is empty', async () => {
      steamService.getOwnedGames.mockResolvedValue([]);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(prisma.userGame.findFirst).not.toHaveBeenCalled();
      expect(gamesService.create).not.toHaveBeenCalled();
    });

    it('processes multiple Steam games in a single job', async () => {
      const steamGames = [makeSteamGame({ appid: 1, name: 'Game A' }), makeSteamGame({ appid: 2, name: 'Game B' })];
      steamService.getOwnedGames.mockResolvedValue(steamGames);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);
      igdbService.search
        .mockResolvedValueOnce([makeIgdbGame({ id: 10, name: 'Game A' })])
        .mockResolvedValueOnce([makeIgdbGame({ id: 20, name: 'Game B' })]);
      gamesService.create.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(gamesService.create).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Post-sync — platform lastSyncAt update
  // ---------------------------------------------------------------------------

  describe('process (platform update after sync)', () => {
    it('updates lastSyncAt on the userPlatform record after all games are processed', async () => {
      steamService.getOwnedGames.mockResolvedValue([]);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_platform: { userId: 'user-1', platform: Platform.STEAM } },
          data: expect.objectContaining({ lastSyncAt: expect.any(Date) }),
        }),
      );
    });

    it('always updates lastSyncAt even when no new games are imported', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);
      igdbService.search.mockResolvedValue([]); // no IGDB match → game skipped
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Ownership — queries are scoped to the job's userId
  // ---------------------------------------------------------------------------

  describe('process (ownership scoping)', () => {
    it('checks for existing games only under the job userId, not globally', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      (prisma.userGame.findFirst as jest.Mock).mockResolvedValue(null);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.create.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-99', steamId: 'steam-id' }));

      expect(prisma.userGame.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-99', steamAppId: 292030 },
      });
    });
  });
});
