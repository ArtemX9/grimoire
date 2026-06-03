import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateSessionDto, Mood, PlaySession, PlaySessionWithGame } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { PlaySessionRelations } from './sessions.types';

type PrismaSession = {
  id: string;
  userId: string;
  gameId: string;
  startedAt: Date;
  durationMin: number | null;
  mood: string[];
  notes: string | null;
};
const FULL_DAY_HOURS = 24 * 60;

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  private _toResponse(session: PrismaSession): PlaySession {
    return {
      id: session.id,
      userID: session.userId,
      gameID: session.gameId,
      startedAt: session.startedAt,
      durationMin: session.durationMin ?? undefined,
      mood: session.mood as Mood[],
      notes: session.notes ?? undefined,
    };
  }

  private _toResponseWithGame(session: PlaySessionRelations): PlaySessionWithGame {
    return {
      ...this._toResponse(session),
      game: session.game.igdbGame,
    };
  }

  async findByGame(userId: string, gameId: string): Promise<PlaySession[]> {
    const sessions = await this.prisma.playSession.findMany({
      where: { userId, gameId },
      orderBy: { startedAt: 'desc' },
    });
    return sessions.map((s) => this._toResponse(s));
  }

  async findRecent(userId: string, limit = 10): Promise<PlaySessionWithGame[]> {
    try {
      const sessions = await this.prisma.playSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: limit,
        include: {
          game: {
            include: {
              igdbGame: { select: { title: true } },
            },
          },
        },
      });
      return sessions.map((s) => this._toResponseWithGame(s));
    } catch (e) {
      throw new NotFoundException('Sessions could not be obtained', JSON.stringify(e));
    }
  }

  async create(userId: string, dto: CreateSessionDto): Promise<PlaySession> {
    const startOfDay = new Date(dto.startedAt);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);

    const playedTime = dto.durationMin ?? 0;
    if (playedTime && playedTime > FULL_DAY_HOURS) {
      throw new BadRequestException('Played time should be less than day');
    }

    const totalPlayedTimeForDay = await this.prisma.playSession.aggregate({
      _sum: { durationMin: true },
      where: {
        userId,
        gameId: dto.gameID,
        startedAt: { gte: startOfDay, lt: startOfNextDay },
      },
    });
    const totalPlayedTimesSession = totalPlayedTimeForDay._sum.durationMin ?? 0;
    if (totalPlayedTimesSession + playedTime > FULL_DAY_HOURS) {
      throw new BadRequestException('Played time should be less than day');
    }
    if (dto.durationMin) {
      const [session] = await this.prisma.$transaction([
        this.prisma.playSession.create({
          data: {
            userId,
            gameId: dto.gameID,
            startedAt: dto.startedAt,
            mood: dto.mood,
            durationMin: dto.durationMin,
            notes: dto.notes,
          },
        }),
        this.prisma.userGame.updateMany({
          where: { id: dto.gameID, userId },
          data: { playtimeHours: { increment: dto.durationMin / 60 } },
        }),
      ]);
      return this._toResponse(session);
    }

    const session = await this.prisma.playSession.create({
      data: { userId, gameId: dto.gameID, startedAt: dto.startedAt, mood: dto.mood, durationMin: dto.durationMin, notes: dto.notes },
    });
    return this._toResponse(session);
  }
}
