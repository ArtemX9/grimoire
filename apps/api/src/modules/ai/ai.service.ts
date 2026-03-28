import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Observable } from 'rxjs';

import { RecommendationContext, RecommendationRequest } from '@grimoire/shared';

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
    private grokProvider: GrokProvider,
    private claudeProvider: ClaudeProvider,
    private gamesService: GamesService,
    private sessionsService: SessionsService,
  ) {
    const providerName = this.config.get<string>('app.llm.provider', 'grok');
    this.provider = providerName === 'claude' ? this.claudeProvider : this.grokProvider;
  }

  async buildContext(userId: string, request: RecommendationRequest): Promise<RecommendationContext> {
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
