import { Processor, WorkerHost } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';

import { Job } from 'bullmq';

import { GameStatus, Genre, Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { PLATFORM_ID_STEAM } from './constants';
import { SteamService } from './steam.service';

@Processor('steam-sync')
export class SteamSyncProcessor extends WorkerHost {
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
    try {
      const steamGames = await this.steamService.getOwnedGames(steamId);

      for (const steamGame of steamGames) {
        const igdbResults = await this.igdbService.search(steamGame.name, 1);
        const igdbGame = igdbResults[0];
        // if (!igdbGame) continue;

        try {
          await this.gamesService.ingestFromSync(
            userId,
            {
              id: `${steamGame.appid}`,
              platformID: PLATFORM_ID_STEAM,
              externalTitle: steamGame.name,
              coverURL: steamGame.img_icon_url,
              playtimeHours: steamGame.playtime_forever / 60,
            },
            igdbGame
              ? {
                  id: igdbGame.id,
                  title: igdbGame.name,
                  coverURL: igdbGame.cover || steamGame.img_icon_url,
                  genres: igdbGame.genres as Genre[],
                  summary: igdbGame.summary,
                  storyLine: igdbGame.storyline,
                  releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : undefined,
                }
              : undefined,
          );
        } catch (e) {
          console.error(e);
          throw new BadRequestException(e);
        }

        await this.prisma.userPlatform.update({
          where: { userId_platformId: { userId, platformId: PLATFORM_ID_STEAM } },
          data: { lastSyncAt: new Date() },
        });
      }
    } catch (e) {
      console.error(e);
      throw new BadRequestException(e);
    }
  }
}
