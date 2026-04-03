import { Processor, WorkerHost } from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { GameStatus, Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { GamesService } from '../../games/games.service';
import { IgdbService } from '../../igdb/igdb.service';
import { SteamService } from './steam.service';
import {BadRequestException} from '@nestjs/common';

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
        const existing = await this.prisma.userGame.findFirst({
          where: { userId, steamAppId: steamGame.appid },
        });
        if (existing) {
          await this.prisma.userGame.update({
            where: { id: existing.id },
            data: { playtimeHours: steamGame.playtime_forever / 60 },
          });
          continue;
        }

        const igdbResults = await this.igdbService.search(steamGame.name, 1);
        const igdbGame = igdbResults[0];
        if (!igdbGame) continue;

        try {
          await this.gamesService.create(userId, {
            igdbId: igdbGame.id,
            steamAppId: steamGame.appid,
            title: igdbGame.name,
            coverUrl: igdbGame.cover?.url,
            genres: igdbGame.genres?.map((g) => g.name) ?? [],
            status: GameStatus.BACKLOG,
            moods: [],
          });
        } catch (e) {
          throw new BadRequestException(e);
        }
      }

      await this.prisma.userPlatform.update({
        where: { userId_platform: { userId, platform: Platform.STEAM } },
        data: { lastSyncAt: new Date() },
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
}
