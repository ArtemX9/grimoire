import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { Job } from 'bullmq';

import { Genre, Theme } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { PLATFORM_ID_XBOX, XBOX_QUEUE_TITLE } from './constants';
import { XboxService } from './xbox.service';

@Processor(XBOX_QUEUE_TITLE)
export class XboxSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(XboxSyncProcessor.name);

  constructor(
    private xboxService: XboxService,
    private igdbService: IgdbService,
    private gamesService: GamesService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ userID: string; xboxAccountID: string }>) {
    const { userID } = job.data;

    const games = await this.xboxService.getOwnedGames(userID);

    await this.prisma.userPlatform.update({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_XBOX } },
      data: { isSyncing: true },
    });

    for (const game of games) {
      const igdbResults = await this.igdbService.search(game.name, 1);
      const igdbGame = igdbResults[0];

      try {
        await this.gamesService.ingestFromSync(
          userID,
          {
            id: game.titleId ?? game.modernTitleId,
            platformID: PLATFORM_ID_XBOX,
            externalTitle: game.name,
            coverURL: game.displayImage,
          },
          igdbGame
            ? {
                id: igdbGame.id,
                title: igdbGame.name,
                coverURL: igdbGame.cover || game.displayImage,
                genres: igdbGame.genres as Genre[],
                summary: igdbGame.summary,
                storyLine: igdbGame.storyline,
                themes: igdbGame.themes as Theme[],
                releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : undefined,
              }
            : undefined,
        );
      } catch (e) {
        this.logger.warn(`Skipping "${game.name}" for user ${userID}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await this.prisma.userPlatform.update({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_XBOX } },
      data: { lastSyncAt: new Date(), isSyncing: false },
    });
  }
}
