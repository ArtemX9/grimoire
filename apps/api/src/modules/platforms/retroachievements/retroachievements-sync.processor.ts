import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { Job } from 'bullmq';

import { GameStatus, Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { RetroAchievementsService } from './retroachievements.service';

@Processor('retroachievements-sync')
export class RetroAchievementsSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(RetroAchievementsSyncProcessor.name);

  constructor(
    private raService: RetroAchievementsService,
    private gamesService: GamesService,
    private igdbService: IgdbService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ userId: string; raUsername: string }>) {
    const { userId, raUsername } = job.data;

    const games = await this.raService.getRecentGames(raUsername);

    for (const game of games) {
      const existing = await this.prisma.userGame.findFirst({
        where: { userId, title: game.Title },
      });
      if (existing) continue;

      const igdbResults = await this.igdbService.search(game.Title, 1);
      const igdbGame = igdbResults[0];
      if (!igdbGame) continue;

      try {
        await this.gamesService.create(userId, {
          igdbId: igdbGame.id,
          title: igdbGame.name,
          coverUrl: igdbGame.cover?.url,
          genres: igdbGame.genres ?? [],
          status: GameStatus.BACKLOG,
          moods: [],
        });
      } catch (e) {
        this.logger.warn(`Failed to create RA game "${game.Title}": ${e}`);
      }
    }

    await this.prisma.userPlatform.update({
      where: { userId_platform: { userId, platform: Platform.RETROACHIEVEMENTS } },
      data: { lastSyncAt: new Date() },
    });
  }
}
