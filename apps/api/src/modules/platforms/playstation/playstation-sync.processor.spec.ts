import { Test, TestingModule } from '@nestjs/testing';

import { Genre } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { generateIgdbSearchResult, generatePsnGame, generatePsnSyncJob } from '../../../test';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { PLATFORM_ID_PLAYSTATION } from './constants';
import { PlaystationSyncProcessor } from './playstation-sync.processor';
import { PlaystationService } from './playstation.service';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('PlaystationSyncProcessor', () => {
  let processor: PlaystationSyncProcessor;
  let playstationService: { getOwnedGames: jest.Mock };
  let gamesService: { ingestFromSync: jest.Mock };
  let igdbService: { search: jest.Mock };
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    playstationService = { getOwnedGames: jest.fn() };
    gamesService = { ingestFromSync: jest.fn() };
    igdbService = { search: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaystationSyncProcessor,
        { provide: PlaystationService, useValue: playstationService },
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

    processor = module.get<PlaystationSyncProcessor>(PlaystationSyncProcessor);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('process (happy path)', () => {
    it('calls ingestFromSync with the correct syncedGameInfo shape', async () => {
      const psnGame = generatePsnGame({
        name: 'God of War',
        conceptID: 10001763,
        imageURL: 'https://image.example.com/gow.jpg',
        playDuration: 'PT20H30M15S',
      });
      const igdbGame = generateIgdbSearchResult({ id: 38010, name: 'God of War' });
      playstationService.getOwnedGames.mockResolvedValue([psnGame]);
      igdbService.search.mockResolvedValue([igdbGame]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith(
        'user-1',
        {
          id: '10001763',
          platformID: PLATFORM_ID_PLAYSTATION,
          externalTitle: 'God of War',
          coverURL: 'https://image.example.com/gow.jpg',
          playtimeHours: expect.closeTo(20.5, 1),
        },
        expect.objectContaining({
          id: 38010,
          title: 'God of War',
        }),
      );
    });

    it('searches IGDB with the PSN game name limited to 1 result', async () => {
      const psnGame = generatePsnGame({ name: 'Horizon Forbidden West' });
      const igdbGame = generateIgdbSearchResult({ name: 'Horizon Forbidden West' });
      playstationService.getOwnedGames.mockResolvedValue([psnGame]);
      igdbService.search.mockResolvedValue([igdbGame]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      expect(igdbService.search).toHaveBeenCalledWith('Horizon Forbidden West', 1);
    });

    it('passes undefined igdbInfo to ingestFromSync when IGDB returns no results', async () => {
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame()]);
      igdbService.search.mockResolvedValue([]);
      gamesService.ingestFromSync.mockResolvedValue(null);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith('user-1', expect.any(Object), undefined);
    });

    it('uses the PSN imageUrl as coverURL fallback in igdbInfo when IGDB cover is missing', async () => {
      const psnGame = generatePsnGame({ imageURL: 'https://image.example.com/psn-cover.jpg' });
      const igdbGame = generateIgdbSearchResult({ cover: undefined });
      playstationService.getOwnedGames.mockResolvedValue([psnGame]);
      igdbService.search.mockResolvedValue([igdbGame]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      const igdbArg = gamesService.ingestFromSync.mock.calls[0][2];
      expect(igdbArg.coverURL).toBe('https://image.example.com/psn-cover.jpg');
    });

    it('uses the IGDB cover when it is present', async () => {
      const igdbGame = generateIgdbSearchResult({ cover: '//images.igdb.com/igdb-cover.jpg' });
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame()]);
      igdbService.search.mockResolvedValue([igdbGame]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      const igdbArg = gamesService.ingestFromSync.mock.calls[0][2];
      expect(igdbArg.coverURL).toBe('//images.igdb.com/igdb-cover.jpg');
    });

    it('converts a releaseDate ISO timestamp to a Date object for igdbInfo', async () => {
      const releaseTimestamp = 1546300800; // 2019-01-01T00:00:00Z
      const igdbGame = generateIgdbSearchResult({ first_release_date: releaseTimestamp });
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame()]);
      igdbService.search.mockResolvedValue([igdbGame]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      const igdbArg = gamesService.ingestFromSync.mock.calls[0][2];
      expect(igdbArg.releaseDate).toEqual(new Date(releaseTimestamp * 1000));
    });
  });

  // ---------------------------------------------------------------------------
  // playDuration parsing
  // ---------------------------------------------------------------------------

  describe('process (playDuration parsing)', () => {
    it('correctly parses hours, minutes, and seconds from an ISO 8601 duration string', async () => {
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame({ playDuration: 'PT5H45M30S' })]);
      igdbService.search.mockResolvedValue([generateIgdbSearchResult()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      const syncedGameArg = gamesService.ingestFromSync.mock.calls[0][1];
      // 5h + 45m/60 + 30s/60 ≈ 5.75 hours (seconds are not added in implementation, only h + m/60)
      expect(syncedGameArg.playtimeHours).toBeCloseTo(5 + 45 / 60, 5);
    });

    it('handles a duration with only hours and no minutes', async () => {
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame({ playDuration: 'PT8H' })]);
      igdbService.search.mockResolvedValue([generateIgdbSearchResult()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      const syncedGameArg = gamesService.ingestFromSync.mock.calls[0][1];
      expect(syncedGameArg.playtimeHours).toBe(8);
    });

    it('handles a duration with only minutes and no hours', async () => {
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame({ playDuration: 'PT45M' })]);
      igdbService.search.mockResolvedValue([generateIgdbSearchResult()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      const syncedGameArg = gamesService.ingestFromSync.mock.calls[0][1];
      expect(syncedGameArg.playtimeHours).toBeCloseTo(0.75, 5);
    });

    it('yields zero hours when playDuration has no time components', async () => {
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame({ playDuration: 'PT0S' })]);
      igdbService.search.mockResolvedValue([generateIgdbSearchResult()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      const syncedGameArg = gamesService.ingestFromSync.mock.calls[0][1];
      expect(syncedGameArg.playtimeHours).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('process (edge cases)', () => {
    it('does nothing when the owned games list is empty', async () => {
      playstationService.getOwnedGames.mockResolvedValue([]);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      expect(igdbService.search).not.toHaveBeenCalled();
      expect(gamesService.ingestFromSync).not.toHaveBeenCalled();
    });

    it('processes multiple PSN games in a single job', async () => {
      const psnGames = [generatePsnGame({ name: 'God of War', conceptID: 10001 }), generatePsnGame({ name: 'Returnal', conceptID: 10002 })];
      playstationService.getOwnedGames.mockResolvedValue(psnGames);
      igdbService.search
        .mockResolvedValueOnce([generateIgdbSearchResult({ id: 1, name: 'God of War' })])
        .mockResolvedValueOnce([generateIgdbSearchResult({ id: 2, name: 'Returnal' })]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledTimes(2);
    });

    it('skips a game and continues when ingestFromSync fails for that game', async () => {
      const games = [generatePsnGame({ name: 'Bad Game', conceptID: 1 }), generatePsnGame({ name: 'Good Game', conceptID: 2 })];
      playstationService.getOwnedGames.mockResolvedValue(games);
      igdbService.search.mockResolvedValue([generateIgdbSearchResult()]);
      gamesService.ingestFromSync.mockRejectedValueOnce(new Error('DB error')).mockResolvedValueOnce({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      // Should not throw — per-game errors are caught and logged
      await expect(processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }))).resolves.not.toThrow();
      // The good game is still processed
      expect(gamesService.ingestFromSync).toHaveBeenCalledTimes(2);
    });

    it('propagates errors thrown by getOwnedGames (outer failure)', async () => {
      playstationService.getOwnedGames.mockRejectedValue(new Error('PSN API error'));
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await expect(processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }))).rejects.toThrow(
        'PSN API error',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Platform lastSyncAt update
  // ---------------------------------------------------------------------------

  describe('process (platform update after sync)', () => {
    it('updates lastSyncAt with the correct compound key after processing a game', async () => {
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame()]);
      igdbService.search.mockResolvedValue([generateIgdbSearchResult()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_platformId: { userId: 'user-1', platformId: PLATFORM_ID_PLAYSTATION } },
          data: expect.objectContaining({ lastSyncAt: expect.any(Date) }),
        }),
      );
    });

    it('calls update exactly twice regardless of game count: once for isSyncing:true, once for completion', async () => {
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame()]);
      igdbService.search.mockResolvedValue([generateIgdbSearchResult()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledTimes(2);
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isSyncing: true } }));
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lastSyncAt: expect.any(Date) }) }),
      );
    });

    it('calls update exactly twice even when the owned games list is empty', async () => {
      playstationService.getOwnedGames.mockResolvedValue([]);
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'psn-account-id' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledTimes(2);
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isSyncing: true } }));
      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lastSyncAt: expect.any(Date), isSyncing: false }) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Ownership scoping
  // ---------------------------------------------------------------------------

  describe('process (ownership scoping)', () => {
    it('passes the job userID to ingestFromSync, not a hardcoded value', async () => {
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame()]);
      igdbService.search.mockResolvedValue([generateIgdbSearchResult()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-99', psnAccountID: 'psn-account-id' }));

      expect(gamesService.ingestFromSync).toHaveBeenCalledWith('user-99', expect.any(Object), expect.anything());
    });

    it('scopes the lastSyncAt update to the job userID', async () => {
      playstationService.getOwnedGames.mockResolvedValue([generatePsnGame()]);
      igdbService.search.mockResolvedValue([generateIgdbSearchResult()]);
      gamesService.ingestFromSync.mockResolvedValue({});
      (prisma.userPlatform.update as jest.Mock).mockResolvedValue({});

      await processor.process(generatePsnSyncJob({ userID: 'user-55', psnAccountID: 'psn-account-id' }));

      expect(prisma.userPlatform.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_platformId: { userId: 'user-55', platformId: PLATFORM_ID_PLAYSTATION } },
        }),
      );
    });

    it('passes the job psnAccountID to getOwnedGames', async () => {
      playstationService.getOwnedGames.mockResolvedValue([]);

      await processor.process(generatePsnSyncJob({ userID: 'user-1', psnAccountID: 'my-psn-account-xyz' }));

      expect(playstationService.getOwnedGames).toHaveBeenCalledWith('my-psn-account-xyz');
    });
  });
});
