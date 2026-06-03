import { Injectable } from '@nestjs/common';

import { DEFAULT_LIMIT, DEFAULT_OFFSET, MapUnmappedGameSchemaDto, PlatformType, UnmappedGame, UnmappedReasons } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { GamesService } from '../games/games.service';
import { UnmappedGameWithRelations } from './unmapped-games.types';

@Injectable()
export class UnmappedGamesService {
  constructor(
    private prisma: PrismaService,
    private gamesService: GamesService,
  ) {}

  async getUnmappedGamesForUser(userID: string, limit: number = DEFAULT_LIMIT, offset: number = DEFAULT_OFFSET): Promise<UnmappedGame[]> {
    const unmappedGames = await this.prisma.unmappedSyncedGame.findMany({
      where: {
        userId: userID,
        isMapped: false,
        NOT: { reason: UnmappedReasons.USER_DELETED },
      },
      include: {
        syncedGame: {
          include: {
            platform: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      skip: offset,
    });

    return unmappedGames.map(this._toResponse);
  }

  async mapGameForUser(userID: string, unmappedGameID: string, dto: MapUnmappedGameSchemaDto) {
    await this.prisma.$transaction(async (tx) => {
      const unresolved = await tx.unmappedSyncedGame.findUniqueOrThrow({
        where: { id: unmappedGameID, userId: userID },
        include: { syncedGame: true },
      });

      await this.gamesService.ingestFromSync(
        userID,
        {
          id: unresolved.syncedGame.externalId,
          platformID: unresolved.syncedGame.platformId,
          externalTitle: unresolved.syncedGame.externalTitle,
          coverURL: unresolved.syncedGame.coverUrl ?? undefined,
          playtimeHours: unresolved.playtimeHours,
          isManualMapping: true,
        },
        {
          id: dto.igdbInfo.id,
          title: dto.igdbInfo.title,
          coverURL: dto.igdbInfo.coverUrl || '',
          genres: dto.igdbInfo.genres,
          summary: dto.igdbInfo.summary,
          storyLine: dto.igdbInfo.storyLine,
          releaseDate: dto.igdbInfo.releaseDate,
          themes: dto.igdbInfo.themes,
        },
        tx,
      );

      await tx.unmappedSyncedGame.update({
        where: {
          userId_syncedGameId: {
            userId: userID,
            syncedGameId: unresolved.syncedGameId,
          },
        },
        data: {
          isMapped: true,
          igdbGameId: dto.igdbInfo.id,
        },
      });
    });
  }

  async deleteGame(userID: string, unmappedGameID: string) {
    await this.prisma.unmappedSyncedGame.findUniqueOrThrow({
      where: {
        id: unmappedGameID,
        userId: userID,
      },
    });

    await this.prisma.unmappedSyncedGame.update({
      where: {
        id: unmappedGameID,
        userId: userID,
      },
      data: {
        reason: UnmappedReasons.USER_DELETED,
      },
    });
  }

  private _toResponse(unmappedGame: UnmappedGameWithRelations): UnmappedGame {
    if (!Object.values(UnmappedReasons).includes(unmappedGame.reason as UnmappedReasons)) {
      throw new Error(`Unknown unmapped reason: ${unmappedGame.reason}`);
    }
    return {
      id: unmappedGame.id,
      syncedGameID: unmappedGame.syncedGameId,
      playtimeHours: unmappedGame.playtimeHours,
      isMapped: unmappedGame.isMapped,
      createdAt: unmappedGame.createdAt,
      coverURL: unmappedGame.syncedGame.coverUrl ?? undefined,
      updatedAt: unmappedGame.updatedAt,
      reason: unmappedGame.reason as UnmappedReasons,
      platform: unmappedGame.syncedGame.platform as PlatformType,
      syncedGameTitle: unmappedGame.syncedGame.externalTitle,
    };
  }
}
