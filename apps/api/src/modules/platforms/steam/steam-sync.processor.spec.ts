import { Test, TestingModule } from '@nestjs/testing';

import { Job } from 'bullmq';

import { Genre } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { PLATFORM_ID_STEAM } from './constants';
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
    cover: '//images.igdb.com/cover.jpg',
    genres: [Genre.RPG],
    summary: 'Open world RPG',
    storyline: undefined,
    first_release_date: undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SteamSyncProcessor', () => {
  let processor: SteamSyncProcessor;
  let steamService: { getOwnedGames: jest.Mock };
  let gamesService: { ingestFromSync: jest.Mock };
  let igdbService: { search: jest.Mock };
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    steamService = { getOwnedGames: jest.fn() };
    gamesService = { ingestFromSync: jest.fn() };
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
  // Happy path — new games imported via ingestFromSync
  // ---------------------------------------------------------------------------

  describe('process (new games)', () => {
    it('calls ingestFromSync with the correct syncedGameInfo shape', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: '76561198000000001' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith(
        'user-1',
        {
          id: '292030',
          platformID: PLATFORM_ID_STEAM,
          externalTitle: 'The Witcher 3: Wild Hunt',
          coverURL: 'https://media.steampowered.com/steamcommunity/public/images/apps/292030/icon.jpg.jpg',
          playtimeHours: 50, // 3000 / 60
        },
        expect.objectContaining({
          id: 1942,
          title: 'The Witcher 3: Wild Hunt',
        }),
      );
    });

    it('searches IGDB with the Steam game name limited to 1 result', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame({ name: 'Halo Infinite' })]);
      igdbService.search.mockResolvedValue([makeIgdbGame({ name: 'Halo Infinite' })]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(igdbService.search).toHaveBeenCalledWith('Halo Infinite', 1);
    });

    it('passes undefined igdbInfo to ingestFromSync when IGDB returns no results', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      igdbService.search.mockResolvedValue([]);
      gamesService.ingestFromSync.mockResolvedValue(null);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith('user-1', expect.any(Object), undefined);
    });

    it('converts playtime_forever from minutes to hours', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame({ playtime_forever: 120 })]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith('user-1', expect.objectContaining({ playtimeHours: 2 }), expect.anything());
    });

    it('uses the Steam icon URL as coverURL fallback in the IGDB info when IGDB cover is missing', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame({ img_icon_url: 'steam-icon.jpg' })]);
      igdbService.search.mockResolvedValue([makeIgdbGame({ cover: undefined })]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      const igdbArg = gamesService.ingestFromSync.mock.calls[0][2];
      expect(igdbArg.coverURL).toBe('steam-icon.jpg');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('process (edge cases)', () => {
    it('does nothing when the owned games list is empty', async () => {
      steamService.getOwnedGames.mockResolvedValue([]);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(igdbService.search).not.toHaveBeenCalled();
      expect(gamesService.ingestFromSync).not.toHaveBeenCalled();
    });

    it('processes multiple Steam games in a single job', async () => {
      const steamGames = [makeSteamGame({ appid: 1, name: 'Game A' }), makeSteamGame({ appid: 2, name: 'Game B' })];
      steamService.getOwnedGames.mockResolvedValue(steamGames);
      igdbService.search
        .mockResolvedValueOnce([makeIgdbGame({ id: 10, name: 'Game A' })])
        .mockResolvedValueOnce([makeIgdbGame({ id: 20, name: 'Game B' })]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Post-sync — platform lastSyncAt update
  // ---------------------------------------------------------------------------

  describe('process (platform update after sync)', () => {
    it('updates lastSyncAt with the correct compound key after processing a game', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_platformId: { userId: 'user-1', platformId: PLATFORM_ID_STEAM } },
          data: expect.objectContaining({ lastSyncAt: expect.any(Date) }),
        }),
      );
    });

    it('calls update exactly twice regardless of game count: once for isSyncing:true, once for completion', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledTimes(2);
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isSyncing: true } }));
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lastSyncAt: expect.any(Date) }) }),
      );
    });

    it('calls update exactly twice even when the owned games list is empty', async () => {
      steamService.getOwnedGames.mockResolvedValue([]);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-1', steamId: 'steam-id' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledTimes(2);
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isSyncing: true } }));
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lastSyncAt: expect.any(Date), isSyncing: false }) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Ownership — queries are scoped to the job's userId
  // ---------------------------------------------------------------------------

  describe('process (ownership scoping)', () => {
    it('passes the job userId to ingestFromSync, not a hardcoded value', async () => {
      steamService.getOwnedGames.mockResolvedValue([makeSteamGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userId: 'user-99', steamId: 'steam-id' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith('user-99', expect.any(Object), expect.anything());
    });
  });
});
