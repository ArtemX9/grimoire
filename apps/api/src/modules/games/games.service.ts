import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateGameDto, GameStatus, Genre, Mood, Platform, RemapGameDto, UpdateGameDto } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { GameResponse, GameStatsResponse, IgdbSyncGameInfo, IngestedSyncGameInfo, UserGameWithRelations } from './games.types';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  private _toResponse(game: UserGameWithRelations): GameResponse {
    return {
      id: game.id,
      userID: game.userId,
      igdbID: game.igdbGame.igdbId,
      title: game.igdbGame.title,
      coverURL: game.igdbGame.coverUrl ?? undefined,
      genres: game.igdbGame.genres as Genre[],
      status: game.status as GameStatus,
      playtimeHours: game.playtimeHours,
      releaseDate: game.igdbGame.releaseDate,
      userRating: game.userRating ?? undefined,
      notes: game.notes ?? undefined,
      moods: game.moods as Mood[],
      addedAt: game.addedAt,
      updatedAt: game.updatedAt,
      isMappedManually: game.isMappedManually,
      platforms: game.userGamePlatforms.map((ugp: UserGameWithRelations['userGamePlatforms'][number]) => ({
        platformID: ugp.syncedGame.platform.id,
        platformName: ugp.syncedGame.platform.platform as Platform,
        externalID: ugp.syncedGame.externalId,
        externalTitle: ugp.syncedGame.externalTitle,
      })),
    };
  }

  async findAll(userId: string, status?: GameStatus, search?: string, genre?: Genre): Promise<GameResponse[]> {
    try {
      const games = await this.prisma.userGame.findMany({
        where: {
          userId,
          ...(status && { status }),
          ...(search && {
            igdbGame: {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
          }),
          ...(genre && {
            igdbGame: {
              genres: {
                has: genre,
              },
            },
          }),
        },
        include: {
          igdbGame: true,
          userGamePlatforms: {
            include: {
              syncedGame: {
                include: {
                  platform: {
                    select: {
                      id: true,
                      platform: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          igdbGame: {
            title: 'desc',
          },
        },
      });
      return games.map((g) => this._toResponse(g));
    } catch (e) {
      throw new NotFoundException('Games could not be obtained', JSON.stringify(e));
    }
  }

  async findOne(userId: string, userGameID: string): Promise<GameResponse> {
    const game = await this.prisma.userGame.findUnique({
      where: {
        id: userGameID,
        userId,
      },
      include: {
        igdbGame: true,
        userGamePlatforms: {
          include: {
            syncedGame: {
              include: {
                platform: {
                  select: {
                    id: true,
                    platform: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!game) throw new NotFoundException('Game not found');
    return this._toResponse(game);
  }

  async addManually(userId: string, dto: CreateGameDto): Promise<GameResponse> {
    const igdbGame = await this.prisma.iGDBGame.upsert({
      where: {
        igdbId: dto.igdbId,
      },
      update: {
        title: dto.title,
        coverUrl: dto.coverUrl,
        genres: dto.genres,
        summary: dto.summary,
        storyLine: dto.storyLine,
        releaseDate: dto.releaseDate,
      },
      create: {
        title: dto.title,
        igdbId: dto.igdbId,
        coverUrl: dto.coverUrl,
        genres: dto.genres,
        summary: dto.summary,
        storyLine: dto.storyLine,
        releaseDate: dto.releaseDate,
      },
    });

    const game = await this.prisma.userGame.create({
      data: {
        userId,
        status: dto.status,
        playtimeHours: 0,
        userRating: null,
        notes: null,
        moods: [],
        igdbGameId: igdbGame.id,
      },
    });

    return this._toResponse({ ...game, igdbGame, userGamePlatforms: [] });
  }

  async remap(userId: string, originalGameID: string, dto: RemapGameDto): Promise<GameResponse> {
    const igdbGame = await this.prisma.iGDBGame.upsert({
      where: {
        igdbId: dto.igdbId,
      },
      update: {
        title: dto.title,
        coverUrl: dto.coverUrl,
        genres: dto.genres,
        summary: dto.summary,
        storyLine: dto.storyLine,
        releaseDate: dto.releaseDate,
      },
      create: {
        title: dto.title,
        igdbId: dto.igdbId,
        coverUrl: dto.coverUrl,
        genres: dto.genres,
        summary: dto.summary,
        storyLine: dto.storyLine,
        releaseDate: dto.releaseDate,
      },
    });

    // When game was created as part of SYNC process
    if (!!dto.platformId && !!dto.externalId) {
      const { platformId, externalId } = dto;
      const userGameID = await this.prisma.$transaction(async (tx) => {
        const syncedGame = await tx.syncedGame.findUnique({
          where: {
            platformId_externalId: {
              platformId,
              externalId,
            },
          },
        });

        if (!syncedGame) {
          throw new NotFoundException('There was an error finding existing synced game', JSON.stringify(dto));
        }

        // Find or create the TARGET UserGame (correct IGDB entry)
        let targetGame = await tx.userGame.findUnique({
          where: { userId_igdbGameId: { userId, igdbGameId: igdbGame.id } },
        });
        if (!targetGame) {
          const original = await tx.userGame.findUniqueOrThrow({ where: { id: originalGameID } });
          targetGame = await tx.userGame.create({
            data: {
              userId,
              igdbGameId: igdbGame.id,
              status: original.status, // carry over state
              playtimeHours: original.playtimeHours,
              moods: original.moods,
              isMappedManually: true,
            },
          });
        }

        // Move the platform link from original → target
        await tx.userGamePlatform.update({
          where: {
            userGameId_syncedGameId: {
              userGameId: originalGameID, // ← old owner
              syncedGameId: syncedGame.id,
            },
          },
          data: { userGameId: targetGame.id }, // ← new owner
        });

        const remainingPlatforms = await tx.userGamePlatform.count({
          where: { userGameId: originalGameID },
        });

        if (!targetGame.isMappedManually) {
          await tx.userGame.update({
            where: { id: targetGame.id },
            data: { isMappedManually: true },
          });
        }

        if (remainingPlatforms === 0) {
          const original = await tx.userGame.findUnique({ where: { id: originalGameID } });
          if (original && !original.isMappedManually) {
            await tx.userGame.delete({ where: { id: originalGameID } });
          }
        }

        return targetGame.id;
      });

      return await this.findOne(userId, userGameID);
    }

    // When game was created by user manually
    const userGame = await this.prisma.userGame.update({
      where: {
        id: originalGameID,
      },
      data: {
        igdbGameId: igdbGame.id,
        isMappedManually: true,
      },
    });

    return this._toResponse({ ...userGame, igdbGame, userGamePlatforms: [] });
  }

  async update(userId: string, id: string, dto: UpdateGameDto): Promise<GameResponse> {
    await this._findOwned(userId, id);
    const game = await this.prisma.userGame.update({
      where: { id },
      data: dto,
      include: {
        igdbGame: true,
        userGamePlatforms: {
          include: {
            syncedGame: {
              include: {
                platform: {
                  select: {
                    id: true,
                    platform: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return this._toResponse(game);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this._findOwned(userId, id);
    await this.prisma.userGame.delete({ where: { id } });
  }

  async getStats(userId: string): Promise<GameStatsResponse> {
    const [total, byStatus, totalHours] = await Promise.all([
      this.prisma.userGame.count({ where: { userId } }),
      this.prisma.userGame.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      this.prisma.userGame.aggregate({
        where: { userId },
        _sum: { playtimeHours: true },
      }),
    ]);
    return {
      total,
      byStatus,
      totalHours: totalHours._sum.playtimeHours ?? 0,
    };
  }

  async ingestFromSync(userID: string, syncedGameInfo: IngestedSyncGameInfo, syncedGameIGDBInfo: IgdbSyncGameInfo): Promise<GameResponse> {
    // Update SyncedGame table with fresh info
    const syncedGameRow = await this.prisma.syncedGame.upsert({
      where: {
        platformId_externalId: {
          platformId: syncedGameInfo.platformID,
          externalId: syncedGameInfo.id,
        },
      },
      create: {
        platformId: syncedGameInfo.platformID,
        externalId: syncedGameInfo.id,
        externalTitle: syncedGameInfo.externalTitle ?? '',
        coverUrl: syncedGameInfo.coverURL,
        summary: syncedGameInfo.summary,
      },
      update: {
        externalTitle: syncedGameInfo.externalTitle ?? '',
        coverUrl: syncedGameInfo.coverURL,
        summary: syncedGameInfo.summary,
      },
    });

    // Update IGDBGame table with fresh info
    const igdbGameRow = await this.prisma.iGDBGame.upsert({
      where: {
        igdbId: syncedGameIGDBInfo.id,
      },
      create: {
        igdbId: syncedGameIGDBInfo.id,
        title: syncedGameIGDBInfo.title,
        coverUrl: syncedGameIGDBInfo.coverURL,
        genres: syncedGameIGDBInfo.genres,
        summary: syncedGameIGDBInfo.summary,
        storyLine: syncedGameIGDBInfo.storyLine,
        releaseDate: syncedGameIGDBInfo.releaseDate,
      },
      update: {
        title: syncedGameIGDBInfo.title,
        coverUrl: syncedGameIGDBInfo.coverURL,
        genres: syncedGameIGDBInfo.genres,
        summary: syncedGameIGDBInfo.summary,
        storyLine: syncedGameIGDBInfo.storyLine,
        releaseDate: syncedGameIGDBInfo.releaseDate,
      },
    });

    const userGamePlatform = await this.prisma.userGamePlatform.findFirst({
      where: {
        syncedGameId: syncedGameRow.id,
        userGame: { userId: userID },
      },
      include: {
        userGame: {
          select: {
            isMappedManually: true,
            playtimeHours: true,
          },
        },
      },
    });

    // Already ingested
    if (userGamePlatform) {
      // We do not touch manual mappings
      if (userGamePlatform.userGame.isMappedManually) {
        const userGame = await this.prisma.userGame.findUniqueOrThrow({
          where: {
            id: userGamePlatform.userGameId,
          },
          include: {
            igdbGame: true,
            userGamePlatforms: {
              include: {
                syncedGame: {
                  include: {
                    platform: {
                      select: {
                        id: true,
                        platform: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        return this._toResponse(userGame);
      }

      // Game exists, and it was created during previous ingestions, then we need to check if playtime hours have changed
      if (syncedGameInfo.playtimeHours && userGamePlatform.userGame.playtimeHours < syncedGameInfo.playtimeHours) {
        const userGame = await this.prisma.userGame.update({
          where: {
            id: userGamePlatform.userGameId,
          },
          data: {
            playtimeHours: syncedGameInfo.playtimeHours,
          },
          include: {
            igdbGame: true,
            userGamePlatforms: {
              include: {
                syncedGame: {
                  include: {
                    platform: {
                      select: {
                        id: true,
                        platform: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        return this._toResponse(userGame);
      }

      // already linked, nothing to do — return existing
      return this.findOne(userID, userGamePlatform.userGameId);
    }

    // Game does not exist yet for the user - we need to create it and map to SyncedGames
    const userGameRow = await this.prisma.userGame.create({
      data: {
        userId: userID,
        status: GameStatus.BACKLOG,
        playtimeHours: syncedGameInfo.playtimeHours ?? 0,
        igdbGameId: igdbGameRow.id,
      },
    });

    await this.prisma.userGamePlatform.create({
      data: {
        userGameId: userGameRow.id,
        syncedGameId: syncedGameRow.id,
      },
    });

    const userGame = await this.prisma.userGame.findUniqueOrThrow({
      where: {
        id: userGameRow.id,
        userId: userID,
      },
      include: {
        igdbGame: true,
        userGamePlatforms: {
          include: {
            syncedGame: {
              include: {
                platform: {
                  select: {
                    id: true,
                    platform: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this._toResponse(userGame);
  }

  private async _findOwned(userId: string, gameID: string): Promise<void> {
    const game = await this.prisma.userGame.findUnique({
      where: {
        id: gameID,
        userId,
      },
    });
    if (!game) throw new NotFoundException('Game not found');
  }
}
