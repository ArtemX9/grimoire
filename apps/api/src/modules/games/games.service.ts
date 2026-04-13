import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateGameDto, GameStatus, Genre, RemapGameDto, UpdateGameDto } from '@grimoire/shared';

import { UserGame } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GameResponse, GameStatsResponse } from './games.types';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  private _toResponse(game: UserGame): GameResponse {
    return {
      id: game.id,
      userID: game.userId,
      igdbID: game.igdbId,
      steamAppID: game.steamAppId ?? undefined,
      title: game.title,
      coverURL: game.coverUrl ?? undefined,
      genres: game.genres,
      status: game.status as GameStatus,
      playtimeHours: game.playtimeHours,
      userRating: game.userRating ?? undefined,
      notes: game.notes ?? undefined,
      moods: game.moods,
      addedAt: game.addedAt,
      updatedAt: game.updatedAt,
    };
  }

  async findAll(userId: string, status?: GameStatus, search?: string, genre?: Genre): Promise<GameResponse[]> {
    try {
      const games = await this.prisma.userGame.findMany({
        where: {
          userId,
          ...(status && { status }),
          ...(search && {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          }),
          ...(genre && {
            genres: {
              has: genre,
            },
          }),
        },
        orderBy: { updatedAt: 'desc' },
      });
      return games.map((g) => this._toResponse(g));
    } catch (e) {
      throw new NotFoundException('Games could not be obtained', JSON.stringify(e));
    }
  }

  async findOne(userId: string, id: string): Promise<GameResponse> {
    const game = await this.prisma.userGame.findFirst({
      where: {
        id,
        userId,
      },
    });
    if (!game) throw new NotFoundException('Game not found');
    return this._toResponse(game);
  }

  async create(userId: string, dto: CreateGameDto): Promise<GameResponse> {
    const game = await this.prisma.userGame.upsert({
      where: {
        userId_igdbId: {
          userId,
          igdbId: dto.igdbId,
        },
      },
      create: {
        ...dto,
        userId,
      },
      update: {
        // Back-fill Steam-sourced fields that may be absent on a manually added game.
        // User-controlled fields (status, userRating, notes, moods) are intentionally
        // excluded so a sync never overwrites deliberate user data.
        ...(dto.steamAppId !== undefined && { steamAppId: dto.steamAppId }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl }),
        ...(dto.genres !== undefined && { genres: dto.genres }),
      },
    });
    return this._toResponse(game);
  }

  async remap(userId: string, id: string, dto: RemapGameDto): Promise<GameResponse> {
    await this._findOwned(userId, id);
    const game = await this.prisma.userGame.update({
      where: { id },
      data: {
        igdbId: dto.igdbId,
        title: dto.title,
        coverUrl: dto.coverUrl ?? null,
        genres: dto.genres,
      },
    });
    return this._toResponse(game);
  }

  async update(userId: string, id: string, dto: UpdateGameDto): Promise<GameResponse> {
    await this._findOwned(userId, id);
    const game = await this.prisma.userGame.update({
      where: { id },
      data: dto,
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

  private async _findOwned(userId: string, id: string): Promise<void> {
    const game = await this.prisma.userGame.findFirst({
      where: {
        id,
        userId,
      },
    });
    if (!game) throw new NotFoundException('Game not found');
  }
}
