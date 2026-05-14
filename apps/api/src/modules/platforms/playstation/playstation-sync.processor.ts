import { Processor, WorkerHost } from '@nestjs/bullmq';
import { BadRequestException, Logger } from '@nestjs/common';

import { Job } from 'bullmq';

import { Genre, Theme } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { PLATFORM_ID_PLAYSTATION, PLAYSTATION_QUEUE_TITLE } from './constants';
import { PlaystationService } from './playstation.service';

@Processor(PLAYSTATION_QUEUE_TITLE)
export class PlaystationSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(PlaystationSyncProcessor.name);

  constructor(
    private playstationService: PlaystationService,
    private igdbService: IgdbService,
    private gamesService: GamesService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ userID: string; psnAccountID: string }>) {
    const { userID, psnAccountID } = job.data;

    const psnGames = await this.playstationService.getOwnedGames(psnAccountID);

    await this.prisma.userPlatform.update({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_PLAYSTATION } },
      data: { isSyncing: true },
    });

    for (const psnGame of psnGames) {
      const igdbResults = await this.igdbService.search(psnGame.name, 1);
      const igdbGame = igdbResults[0];

      const match = psnGame.playDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const playtime = { h: Number(match?.[1] ?? 0), m: Number(match?.[2] ?? 0), s: Number(match?.[3] ?? 0) };

      try {
        await this.gamesService.ingestFromSync(
          userID,
          {
            id: `${psnGame.concept.id}`,
            platformID: PLATFORM_ID_PLAYSTATION,
            externalTitle: psnGame.name,
            coverURL: psnGame.imageUrl,
            playtimeHours: playtime.h + playtime.m / 60,
          },
          igdbGame
            ? {
                id: igdbGame.id,
                title: igdbGame.name,
                coverURL: igdbGame.cover || psnGame.imageUrl,
                genres: igdbGame.genres as Genre[],
                summary: igdbGame.summary,
                storyLine: igdbGame.storyline,
                themes: igdbGame.themes as Theme[],
                releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : undefined,
              }
            : undefined,
        );
      } catch (e) {
        this.logger.warn(`Skipping "${psnGame.name}" for user ${userID}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await this.prisma.userPlatform.update({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_PLAYSTATION } },
      data: { lastSyncAt: new Date(), isSyncing: false },
    });
  }
}
