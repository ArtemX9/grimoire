import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { Job } from 'bullmq';

import { GameStatus, Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { PsnService } from './psn.service';

@Processor('psn-sync')
export class PsnSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(PsnSyncProcessor.name);

  constructor(
    private psnService: PsnService,
    private gamesService: GamesService,
    private igdbService: IgdbService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ userId: string; psnUsername: string }>) {
    const { userId, psnUsername } = job.data;

    const authorization = await this.psnService.getAccessToken();
    const accountId = await this.psnService.getAccountIdFromUsername(authorization, psnUsername);
    const titles = await this.psnService.getPublicUserGames(authorization, accountId);

    for (const title of titles) {
      const existing = await this.prisma.userGame.findFirst({
        where: { userId, title: title.titleName },
      });
      if (existing) continue;

      const igdbResults = await this.igdbService.search(title.titleName, 1);
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
        this.logger.warn(`Failed to create PSN game "${title.titleName}": ${e}`);
      }
    }

    await this.prisma.userPlatform.update({
      where: { userId_platform: { userId, platform: Platform.PSN } },
      data: { lastSyncAt: new Date() },
    });
  }
}
