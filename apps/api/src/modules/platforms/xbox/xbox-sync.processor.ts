import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { Job } from 'bullmq';

import { GameStatus, Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { XboxService } from './xbox.service';

@Processor('xbox-sync')
export class XboxSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(XboxSyncProcessor.name);

  constructor(
    private xboxService: XboxService,
    private gamesService: GamesService,
    private igdbService: IgdbService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ userId: string; gamertag: string }>) {
    const { userId, gamertag } = job.data;

    const xuid = await this.xboxService.getXuidByGamertag(gamertag);
    if (!xuid) {
      this.logger.warn(`Could not resolve XUID for gamertag: ${gamertag}`);
      return;
    }

    const titles = await this.xboxService.getUserTitles(xuid);

    for (const title of titles) {
      if (!title.name || title.titleType === 'App') continue;

      const existing = await this.prisma.userGame.findFirst({
        where: { userId, title: title.name },
      });
      if (existing) continue;

      const igdbResults = await this.igdbService.search(title.name, 1);
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
        this.logger.warn(`Failed to create Xbox game "${title.name}": ${e}`);
      }
    }

    await this.prisma.userPlatform.update({
      where: { userId_platform: { userId, platform: Platform.XBOX } },
      data: { lastSyncAt: new Date() },
    });
  }
}
