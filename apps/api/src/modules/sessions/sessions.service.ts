import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';

import { CreateSessionDto } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { PlaySessionRelations, SessionResponse, SessionWithGameResponse } from './sessions.types';

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
type PrismaSessionWithGame = PrismaSession & { game: { title: string } };

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  private _toResponse(session: PrismaSession): SessionResponse {
    return {
      id: session.id,
      userId: session.userId,
      gameId: session.gameId,
      startedAt: session.startedAt,
      durationMin: session.durationMin ?? undefined,
      mood: session.mood,
      notes: session.notes ?? undefined,
    };
  }

  private _toResponseWithGame(session: PlaySessionRelations): SessionWithGameResponse {
    return {
      ...this._toResponse(session),
      game: session.game.igdbGame,
    };
  }

  async findByGame(userId: string, gameId: string): Promise<SessionResponse[]> {
    const sessions = await this.prisma.playSession.findMany({
      where: { userId, gameId },
      orderBy: { startedAt: 'desc' },
    });
    return sessions.map((s) => this._toResponse(s));
  }

  async findRecent(userId: string, limit = 10): Promise<SessionWithGameResponse[]> {
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

  async create(userId: string, dto: CreateSessionDto): Promise<SessionResponse> {
    const startOfDay = new Date(dto.startedAt);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);

    const playedTime = dto.durationMin ?? 0;
    if (playedTime && playedTime > FULL_DAY_HOURS) {
      throw new HttpException('Played time should be less than day', HttpStatus.CONFLICT);
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
      throw new HttpException('Played time should be less than day', HttpStatus.CONFLICT);
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
        this.prisma.userGame.update({
          where: { id: dto.gameID },
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
