import { Test, TestingModule } from '@nestjs/testing';

import { Job } from 'bullmq';

import { Genre } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { PLATFORM_ID_XBOX } from './constants';
import { XboxGame } from './types';
import { XboxSyncProcessor } from './xbox-sync.processor';
import { XboxService } from './xbox.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeJob(data: { userID: string; xboxAccountID: string }): Job<{ userID: string; xboxAccountID: string }> {
  return { data } as Job<{ userID: string; xboxAccountID: string }>;
}

function makeXboxGame(overrides: Partial<Pick<XboxGame, 'titleId' | 'modernTitleId' | 'name' | 'displayImage'>> = {}): XboxGame {
  return {
    titleId: 'title-100',
    modernTitleId: 'modern-100',
    name: 'Halo Infinite',
    displayImage: 'https://example.com/halo.jpg',
    pfn: null,
    bingId: null,
    windowsPhoneProductId: null,
    type: 0 as unknown as import('./types').XboxGameType,
    devices: [],
    mediaItemType: 0 as unknown as import('./types').MediaItemType,
    isBundle: false,
    achievement: {
      currentAchievements: 5,
      totalAchievements: 50,
      currentGamerscore: 100,
      totalGamerscore: 1000,
      progressPercentage: 10,
      sourceVersion: 1,
    },
    stats: null,
    gamePass: null,
    images: [],
    titleHistory: { lastTimePlayed: new Date(), visible: true, canHide: false },
    titleRecord: null,
    detail: null,
    friendsWhoPlayed: null,
    alternateTitleIds: null,
    contentBoards: null,
    xboxLiveTier: 0 as unknown as import('./types').XboxLiveTier,
    ...overrides,
  } as XboxGame;
}

function makeIgdbGame(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 9001,
    name: 'Halo Infinite',
    cover: '//images.igdb.com/halo-cover.jpg',
    genres: [Genre.Shooter],
    summary: 'Iconic FPS',
    storyline: undefined,
    themes: [],
    first_release_date: undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('XboxSyncProcessor', () => {
  let processor: XboxSyncProcessor;
  let xboxService: { getOwnedGames: jest.Mock };
  let gamesService: { ingestFromSync: jest.Mock };
  let igdbService: { search: jest.Mock };
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    xboxService = { getOwnedGames: jest.fn() };
    gamesService = { ingestFromSync: jest.fn() };
    igdbService = { search: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XboxSyncProcessor,
        { provide: XboxService, useValue: xboxService },
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

    processor = module.get<XboxSyncProcessor>(XboxSyncProcessor);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('process (happy path)', () => {
    it('calls ingestFromSync with the correct syncedGameInfo shape', async () => {
      const game = makeXboxGame({ titleId: 'title-100', name: 'Halo Infinite', displayImage: 'https://example.com/halo.jpg' });
      xboxService.getOwnedGames.mockResolvedValue([game]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith(
        'user-1',
        {
          id: 'title-100',
          platformID: PLATFORM_ID_XBOX,
          externalTitle: 'Halo Infinite',
          coverURL: 'https://example.com/halo.jpg',
        },
        expect.objectContaining({
          id: 9001,
          title: 'Halo Infinite',
        }),
      );
    });

    it('searches IGDB with the Xbox game name limited to 1 result', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame({ name: 'Forza Horizon 5' })]);
      igdbService.search.mockResolvedValue([makeIgdbGame({ name: 'Forza Horizon 5' })]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      expect(igdbService.search).toHaveBeenCalledWith('Forza Horizon 5', 1);
    });

    it('passes undefined igdbInfo to ingestFromSync when IGDB returns no results', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame()]);
      igdbService.search.mockResolvedValue([]);
      gamesService.ingestFromSync.mockResolvedValue(null);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith('user-1', expect.any(Object), undefined);
    });

    it('uses the Xbox displayImage as coverURL fallback in igdbInfo when IGDB cover is missing', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame({ displayImage: 'https://example.com/xbox-cover.jpg' })]);
      igdbService.search.mockResolvedValue([makeIgdbGame({ cover: undefined })]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      const igdbArg = gamesService.ingestFromSync.mock.calls[0][2];
      expect(igdbArg.coverURL).toBe('https://example.com/xbox-cover.jpg');
    });

    it('uses the IGDB cover when it is present', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame({ cover: '//images.igdb.com/igdb-cover.jpg' })]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      const igdbArg = gamesService.ingestFromSync.mock.calls[0][2];
      expect(igdbArg.coverURL).toBe('//images.igdb.com/igdb-cover.jpg');
    });

    it('converts a releaseDate Unix timestamp to a Date object for igdbInfo', async () => {
      const releaseTimestamp = 1546300800; // 2019-01-01T00:00:00Z
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame({ first_release_date: releaseTimestamp })]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      const igdbArg = gamesService.ingestFromSync.mock.calls[0][2];
      expect(igdbArg.releaseDate).toEqual(new Date(releaseTimestamp * 1000));
    });

    it('uses titleId as the game id in syncedGameInfo', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame({ titleId: 'my-title-id', modernTitleId: 'my-modern-id' })]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      const syncedArg = gamesService.ingestFromSync.mock.calls[0][1];
      expect(syncedArg.id).toBe('my-title-id');
    });
  });

  // ---------------------------------------------------------------------------
  // Per-game error handling (soft failures)
  // ---------------------------------------------------------------------------

  describe('process (per-game error handling)', () => {
    it('skips a failing game and continues processing the remaining games', async () => {
      const games = [makeXboxGame({ titleId: 'bad-game', name: 'Bad Game' }), makeXboxGame({ titleId: 'good-game', name: 'Good Game' })];
      xboxService.getOwnedGames.mockResolvedValue(games);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockRejectedValueOnce(new Error('DB conflict')).mockResolvedValueOnce({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await expect(processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }))).resolves.not.toThrow();

      expect(gamesService.ingestFromSync).toHaveBeenCalledTimes(2);
    });

    it('does not throw when all games fail ingestFromSync', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame(), makeXboxGame({ titleId: 'title-2', name: 'Game 2' })]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockRejectedValue(new Error('DB error'));
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await expect(processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }))).resolves.not.toThrow();
    });

    it('propagates errors thrown by getOwnedGames (outer failure)', async () => {
      xboxService.getOwnedGames.mockRejectedValue(new Error('Xbox API unavailable'));
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await expect(processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }))).rejects.toThrow('Xbox API unavailable');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('process (edge cases)', () => {
    it('sets isSyncing:true even when the owned games list is empty', async () => {
      xboxService.getOwnedGames.mockResolvedValue([]);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      expect(igdbService.search).not.toHaveBeenCalled();
      expect(gamesService.ingestFromSync).not.toHaveBeenCalled();
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isSyncing: true } }));
    });

    it('processes multiple Xbox games in a single job', async () => {
      const games = [makeXboxGame({ titleId: 'title-1', name: 'Game A' }), makeXboxGame({ titleId: 'title-2', name: 'Game B' })];
      xboxService.getOwnedGames.mockResolvedValue(games);
      igdbService.search
        .mockResolvedValueOnce([makeIgdbGame({ id: 10, name: 'Game A' })])
        .mockResolvedValueOnce([makeIgdbGame({ id: 20, name: 'Game B' })]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Platform lastSyncAt update
  // ---------------------------------------------------------------------------

  describe('process (platform update after sync)', () => {
    it('updates lastSyncAt with the correct compound key after processing a game', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_platformId: { userId: 'user-1', platformId: PLATFORM_ID_XBOX } },
          data: expect.objectContaining({ lastSyncAt: expect.any(Date) }),
        }),
      );
    });

    it('calls update twice for one game: once for isSyncing:true and once for lastSyncAt', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-1', xboxAccountID: 'XboxGamertag' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledTimes(2);
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isSyncing: true } }));
    });
  });

  // ---------------------------------------------------------------------------
  // Ownership scoping
  // ---------------------------------------------------------------------------

  describe('process (ownership scoping)', () => {
    it('passes the job userID to getOwnedGames', async () => {
      xboxService.getOwnedGames.mockResolvedValue([]);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-99', xboxAccountID: 'XboxGamertag' }));

      expect(xboxService.getOwnedGames).toHaveBeenCalledWith('user-99');
    });

    it('passes the job userID to ingestFromSync, not a hardcoded value', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-99', xboxAccountID: 'XboxGamertag' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith('user-99', expect.any(Object), expect.anything());
    });

    it('scopes the lastSyncAt update to the job userID', async () => {
      xboxService.getOwnedGames.mockResolvedValue([makeXboxGame()]);
      igdbService.search.mockResolvedValue([makeIgdbGame()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(makeJob({ userID: 'user-55', xboxAccountID: 'XboxGamertag' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_platformId: { userId: 'user-55', platformId: PLATFORM_ID_XBOX } },
        }),
      );
    });
  });
});
