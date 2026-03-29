import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Observable } from 'rxjs';

import { RecommendationContext, RecommendationRequest } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { GamesService } from '../games/games.service';
import { SessionsService } from '../sessions/sessions.service';
import { ClaudeProvider } from './providers/claude.provider';
import { GrokProvider } from './providers/grok.provider';
import { LLMProvider } from './providers/llm-provider.interface';

@Injectable()
export class AiService {
  private provider: LLMProvider;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private grokProvider: GrokProvider,
    private claudeProvider: ClaudeProvider,
    private gamesService: GamesService,
    private sessionsService: SessionsService,
  ) {
    const providerName = this.config.get<string>('app.llm.provider', 'grok');
    this.provider = providerName === 'claude' ? this.claudeProvider : this.grokProvider;
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
        genres: g.genres,
        playtimeHours: g.playtimeHours,
        moods: g.moods,
      })),
      recentSessions: recentSessions.map((s) => ({
        gameTitle: s.game.title,
        durationMin: s.durationMin ?? 0,
        mood: s.mood,
        startedAt: s.startedAt,
      })),
    };
  }

  streamRecommendation(context: RecommendationContext): Observable<string> {
    return this.provider.recommend(context);
  }
}
