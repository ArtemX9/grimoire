import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { SessionsService } from './sessions.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'sess-1',
    userId: 'user-1',
    gameId: 'game-1',
    startedAt: new Date('2024-06-01T10:00:00Z'),
    endedAt: new Date('2024-06-01T12:00:00Z'),
    durationMin: 120,
    mood: ['focused'],
    notes: 'Great session',
    ...overrides,
  };
}

function makeSessionWithGame(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    ...makeSession(overrides),
    game: { title: 'The Witcher 3' },
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: {
            playSession: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            userGame: {
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findByGame
  // ---------------------------------------------------------------------------

  describe('findByGame', () => {
    it('returns sessions for the given user and game, ordered by startedAt desc', async () => {
      const rows = [
        makeSession({ id: 'sess-2', startedAt: new Date('2024-06-02T00:00:00Z') }),
        makeSession({ id: 'sess-1', startedAt: new Date('2024-06-01T00:00:00Z') }),
      ];
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue(rows);

      const result = await service.findByGame('user-1', 'game-1');

      expect(prisma.playSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', gameId: 'game-1' },
        orderBy: { startedAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('sess-2');
    });

    it('maps null endedAt to undefined in the response', async () => {
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue([
        makeSession({ endedAt: null }),
      ]);

      const [result] = await service.findByGame('user-1', 'game-1');

      expect(result.endedAt).toBeUndefined();
    });

    it('maps null durationMin to undefined in the response', async () => {
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue([
        makeSession({ durationMin: null }),
      ]);

      const [result] = await service.findByGame('user-1', 'game-1');

      expect(result.durationMin).toBeUndefined();
    });

    it('maps null notes to undefined in the response', async () => {
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue([
        makeSession({ notes: null }),
      ]);

      const [result] = await service.findByGame('user-1', 'game-1');

      expect(result.notes).toBeUndefined();
    });

    it('returns an empty array when the game has no sessions', async () => {
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findByGame('user-1', 'game-with-no-sessions');

      expect(result).toEqual([]);
    });

    it('scopes the query to the requesting user — never leaks another user\'s sessions', async () => {
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue([]);

      await service.findByGame('user-2', 'game-1');

      expect(prisma.playSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-2' }) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findRecent
  // ---------------------------------------------------------------------------

  describe('findRecent', () => {
    it('returns the most recent sessions enriched with the game title', async () => {
      const rows = [makeSessionWithGame(), makeSessionWithGame({ id: 'sess-2' })];
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue(rows);

      const result = await service.findRecent('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].game.title).toBe('The Witcher 3');
    });

    it('uses the default limit of 10 when none is supplied', async () => {
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue([]);

      await service.findRecent('user-1');

      expect(prisma.playSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });

    it('respects a custom limit when one is provided', async () => {
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue([]);

      await service.findRecent('user-1', 5);

      expect(prisma.playSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('includes the game title via the correct Prisma include clause', async () => {
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue([]);

      await service.findRecent('user-1');

      expect(prisma.playSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { game: { select: { title: true } } },
        }),
      );
    });

    it('orders sessions by startedAt descending', async () => {
      (prisma.playSession.findMany as jest.Mock).mockResolvedValue([]);

      await service.findRecent('user-1');

      expect(prisma.playSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { startedAt: 'desc' } }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create — without durationMin (no playtime update)
  // ---------------------------------------------------------------------------

  describe('create (without durationMin)', () => {
    const dto = {
      gameId: 'game-1',
      startedAt: new Date('2024-06-01T10:00:00Z'),
      mood: [] as string[],
    };

    it('creates a session directly when durationMin is absent', async () => {
      const created = makeSession({ durationMin: null, endedAt: null, notes: null, mood: [] });
      (prisma.playSession.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(prisma.playSession.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result.id).toBe('sess-1');
    });

    it('does not update playtimeHours on the game when durationMin is absent', async () => {
      (prisma.playSession.create as jest.Mock).mockResolvedValue(
        makeSession({ durationMin: null }),
      );

      await service.create('user-1', dto);

      expect(prisma.userGame.update).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // create — with durationMin (transactional playtime update)
  // ---------------------------------------------------------------------------

  describe('create (with durationMin)', () => {
    const dto = {
      gameId: 'game-1',
      startedAt: new Date('2024-06-01T10:00:00Z'),
      durationMin: 120,
      mood: ['excited'] as string[],
    };

    it('uses a transaction to create the session and increment playtimeHours', async () => {
      const created = makeSession({ durationMin: 120 });

      // $transaction receives an array of promises — return the first element
      // (the created session) as the first item of the resolved tuple.
      (prisma.$transaction as jest.Mock).mockResolvedValue([created, {}]);

      const result = await service.create('user-1', dto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.id).toBe('sess-1');
      expect(result.durationMin).toBe(120);
    });

    it('increments playtimeHours by durationMin / 60 on the correct game', async () => {
      const created = makeSession({ durationMin: 120 });
      (prisma.$transaction as jest.Mock).mockResolvedValue([created, {}]);

      // Capture what was passed to $transaction so we can inspect the operations.
      let capturedOps: unknown[] | undefined;
      (prisma.$transaction as jest.Mock).mockImplementation((ops: unknown[]) => {
        capturedOps = ops;
        return Promise.resolve([created, {}]);
      });

      // We need the actual Prisma operation objects.  Because the service passes
      // an array of Prisma operation promises, we verify the updateMany call args
      // via the prisma.userGame.update mock.
      (prisma.userGame.update as jest.Mock).mockResolvedValue({});
      (prisma.playSession.create as jest.Mock).mockResolvedValue(created);

      await service.create('user-1', dto);

      // The transaction array should have been built using prisma.userGame.update.
      expect(prisma.userGame.update).toHaveBeenCalledWith({
        where: { id: 'game-1' },
        data: { playtimeHours: { increment: 2 } }, // 120 / 60 = 2
      });
    });

    it('does not use a transaction when durationMin is zero (falsy)', async () => {
      const dtoNoDuration = { ...dto, durationMin: 0 };
      const created = makeSession({ durationMin: 0 });
      (prisma.playSession.create as jest.Mock).mockResolvedValue(created);

      await service.create('user-1', dtoNoDuration);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('maps the response correctly when created inside a transaction', async () => {
      const created = makeSession({
        id: 'sess-tx',
        durationMin: 60,
        endedAt: new Date('2024-06-01T11:00:00Z'),
        notes: 'txn note',
        mood: ['calm'],
      });
      (prisma.$transaction as jest.Mock).mockResolvedValue([created, {}]);

      const result = await service.create('user-1', { ...dto, durationMin: 60 });

      expect(result.id).toBe('sess-tx');
      expect(result.durationMin).toBe(60);
      expect(result.notes).toBe('txn note');
      expect(result.mood).toEqual(['calm']);
    });
  });
});
