import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { Mood } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { GamesService } from '../games/games.service';
import { SessionsService } from '../sessions/sessions.service';
import { AiService } from './ai.service';
import { ClaudeProvider } from './providers/claude.provider';
import { GrokProvider } from './providers/grok.provider';
import { OllamaProvider } from './providers/ollama.provider';

const MOCK_REQUEST: import('@grimoire/shared').RecommendationRequest = {
  userID: 'user-1',
  moods: [Mood.CHILL],
  sessionLengthMinutes: 60,
};

describe('AiService._checkAndIncrementAiUsage (via buildContext)', () => {
  let service: AiService;
  let prisma: jest.Mocked<PrismaService>;
  let gamesService: jest.Mocked<GamesService>;
  let sessionsService: jest.Mocked<SessionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('grok') },
        },
        {
          provide: PrismaService,
          useValue: {
            aiGlobalSettings: { findUnique: jest.fn() },
            user: { findUnique: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: GamesService,
          useValue: { findAll: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: SessionsService,
          useValue: { findRecent: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: GrokProvider,
          useValue: { recommend: jest.fn() },
        },
        {
          provide: ClaudeProvider,
          useValue: { recommend: jest.fn() },
        },
        {
          provide: OllamaProvider,
          useValue: { recommend: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prisma = module.get(PrismaService);
    gamesService = module.get(GamesService);
    sessionsService = module.get(SessionsService);
  });

  it('throws ForbiddenException when AI is globally disabled', async () => {
    (prisma.aiGlobalSettings.findUnique as jest.Mock).mockResolvedValue({ id: 1, aiEnabled: false });

    await expect(service.buildContext('user-1', MOCK_REQUEST)).rejects.toThrow(ForbiddenException);
    await expect(service.buildContext('user-1', MOCK_REQUEST)).rejects.toThrow('AI features are globally disabled');
  });

  it('throws ForbiddenException when AI is disabled for the user', async () => {
    (prisma.aiGlobalSettings.findUnique as jest.Mock).mockResolvedValue({ id: 1, aiEnabled: true });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      aiEnabled: false,
      aiRequestsUsed: 0,
      aiRequestsLimit: null,
    });

    await expect(service.buildContext('user-1', MOCK_REQUEST)).rejects.toThrow(ForbiddenException);
    await expect(service.buildContext('user-1', MOCK_REQUEST)).rejects.toThrow('AI features are disabled for your account');
  });

  it('throws ForbiddenException when the user has reached their request limit', async () => {
    (prisma.aiGlobalSettings.findUnique as jest.Mock).mockResolvedValue({ id: 1, aiEnabled: true });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      aiEnabled: true,
      aiRequestsUsed: 10,
      aiRequestsLimit: 10,
    });

    await expect(service.buildContext('user-1', MOCK_REQUEST)).rejects.toThrow(ForbiddenException);
    await expect(service.buildContext('user-1', MOCK_REQUEST)).rejects.toThrow('AI request limit reached');
  });

  it('increments aiRequestsUsed when the user is under their limit', async () => {
    (prisma.aiGlobalSettings.findUnique as jest.Mock).mockResolvedValue({ id: 1, aiEnabled: true });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      aiEnabled: true,
      aiRequestsUsed: 5,
      aiRequestsLimit: 10,
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    await service.buildContext('user-1', MOCK_REQUEST);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { aiRequestsUsed: { increment: 1 } },
    });
  });

  it('increments aiRequestsUsed when no limit is set (null)', async () => {
    (prisma.aiGlobalSettings.findUnique as jest.Mock).mockResolvedValue({ id: 1, aiEnabled: true });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      aiEnabled: true,
      aiRequestsUsed: 999,
      aiRequestsLimit: null,
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    await service.buildContext('user-1', MOCK_REQUEST);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { aiRequestsUsed: { increment: 1 } },
    });
  });

  it('proceeds when global settings row is absent (defaults to enabled)', async () => {
    (prisma.aiGlobalSettings.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      aiEnabled: true,
      aiRequestsUsed: 0,
      aiRequestsLimit: null,
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    await expect(service.buildContext('user-1', MOCK_REQUEST)).resolves.toBeDefined();
  });
});
