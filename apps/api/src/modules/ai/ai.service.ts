import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Observable } from 'rxjs';

import { Genre, Mood, RecommendationContext, RecommendationRequest } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { GamesService } from '../games/games.service';
import { SessionsService } from '../sessions/sessions.service';
import { AI_PROVIDERS } from './constants';
import { ClaudeProvider } from './providers/claude.provider';
import { GrokProvider } from './providers/grok.provider';
import { LLMProvider } from './providers/llm-provider.interface';
import { OllamaProvider } from './providers/ollama.provider';

@Injectable()
export class AiService {
  private provider: LLMProvider;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private grokProvider: GrokProvider,
    private claudeProvider: ClaudeProvider,
    private ollamaProvider: OllamaProvider,
    private gamesService: GamesService,
    private sessionsService: SessionsService,
  ) {
    const providerName = this.config.get<AI_PROVIDERS>('app.llm.provider', AI_PROVIDERS.GROK);
    switch (providerName) {
      case AI_PROVIDERS.CLAUDE:
        this.provider = this.claudeProvider;
        break;
      case AI_PROVIDERS.OLLAMA:
        this.provider = this.ollamaProvider;
        break;
      default:
        this.provider = this.grokProvider;
    }
  }

  private async _checkAndIncrementAiUsage(userId: string): Promise<void> {
    const globalSettings = await this.prisma.aiGlobalSettings.findUnique({ where: { id: 1 } });
    if (globalSettings && !globalSettings.aiEnabled) {
      throw new ForbiddenException('AI features are globally disabled');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { aiEnabled: true, aiRequestsUsed: true, aiRequestsLimit: true },
    });

    if (!user) throw new ForbiddenException('User not found');
    if (!user.aiEnabled) throw new ForbiddenException('AI features are disabled for your account');
    if (user.aiRequestsLimit !== null && user.aiRequestsUsed >= user.aiRequestsLimit) {
      throw new ForbiddenException('AI request limit reached');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { aiRequestsUsed: { increment: 1 } },
    });
  }

  async buildContext(userId: string, request: RecommendationRequest): Promise<RecommendationContext> {
    await this._checkAndIncrementAiUsage(userId);

    const [games, recentSessions] = await Promise.all([this.gamesService.findAll(userId), this.sessionsService.findRecent(userId, 5)]);

    return {
      moods: request.moods,
      sessionLengthMinutes: request.sessionLengthMinutes,
      games: games.map((g) => ({
        title: g.title,
        status: g.status,
        genres: g.genres as Genre[],
        playtimeHours: g.playtimeHours,
        moods: g.moods as Mood[],
      })),
      recentSessions: recentSessions.map((s) => ({
        gameTitle: s.game.title,
        durationMin: s.durationMin ?? 0,
        mood: s.mood as Mood[],
        startedAt: s.startedAt,
      })),
    };
  }

  streamRecommendation(context: RecommendationContext): Observable<string> {
    return this.provider.recommend(context);
  }
}
