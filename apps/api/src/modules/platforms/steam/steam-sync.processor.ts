import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { Job } from 'bullmq';

import { Genre, Theme } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { GET_STEAM_IMAGE_LINK, PLATFORM_ID_STEAM, STEAM_QUEUE_TITLE } from './constants';
import { SteamService } from './steam.service';

@Processor(STEAM_QUEUE_TITLE)
export class SteamSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SteamSyncProcessor.name);

  constructor(
    private steamService: SteamService,
    private gamesService: GamesService,
    private igdbService: IgdbService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ userId: string; steamId: string }>) {
    const { userId, steamId } = job.data;

    const steamGames = await this.steamService.getOwnedGames(steamId);

    await this.prisma.userPlatform.update({
      where: { userId_platformId: { userId, platformId: PLATFORM_ID_STEAM } },
      data: { isSyncing: true },
    });

    for (const steamGame of steamGames) {
      const igdbResults = await this.igdbService.search(steamGame.name, 1);
      const igdbGame = igdbResults[0];

      try {
        await this.gamesService.ingestFromSync(
          userId,
          {
            id: `${steamGame.appid}`,
            platformID: PLATFORM_ID_STEAM,
            externalTitle: steamGame.name,
            coverURL: GET_STEAM_IMAGE_LINK(steamGame.appid, steamGame.img_icon_url),
            playtimeHours: steamGame.playtime_forever / 60,
          },
          igdbGame
            ? {
                id: igdbGame.id,
                title: igdbGame.name,
                coverURL: igdbGame.cover || steamGame.img_icon_url,
                genres: igdbGame.genres as Genre[],
                themes: igdbGame.themes as Theme[],
                summary: igdbGame.summary,
                storyLine: igdbGame.storyline,
                releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : undefined,
              }
            : undefined,
        );
      } catch (e) {
        this.logger.warn(`Skipping "${steamGame.name}" for user ${userId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await this.prisma.userPlatform.update({
      where: { userId_platformId: { userId, platformId: PLATFORM_ID_STEAM } },
      data: { lastSyncAt: new Date(), isSyncing: false },
    });
  }
}
