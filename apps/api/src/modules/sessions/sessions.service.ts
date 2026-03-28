import { Injectable } from '@nestjs/common';

import { CreateSessionDto } from '@grimoire/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { SessionResponse, SessionWithGameResponse } from './sessions.types';

type PrismaSession = {
  id: string;
  userId: string;
  gameId: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMin: number | null;
  mood: string[];
  notes: string | null;
};

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
      endedAt: session.endedAt ?? undefined,
      durationMin: session.durationMin ?? undefined,
      mood: session.mood,
      notes: session.notes ?? undefined,
    };
  }

  private _toResponseWithGame(session: PrismaSessionWithGame): SessionWithGameResponse {
    return {
      ...this._toResponse(session),
      game: session.game,
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
    const sessions = await this.prisma.playSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { game: { select: { title: true } } },
    });
    return sessions.map((s) => this._toResponseWithGame(s));
  }

  async create(userId: string, dto: CreateSessionDto): Promise<SessionResponse> {
    if (dto.durationMin) {
      const [session] = await this.prisma.$transaction([
        this.prisma.playSession.create({ data: { ...dto, userId } }),
        this.prisma.userGame.update({
          where: { id: dto.gameId },
          data: { playtimeHours: { increment: dto.durationMin / 60 } },
        }),
      ]);
      return this._toResponse(session);
    }

    const session = await this.prisma.playSession.create({ data: { ...dto, userId } });
    return this._toResponse(session);
  }
}
