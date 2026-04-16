import { Prisma } from '../../generated/prisma/client';

export type SessionResponse = {
  id: string;
  userId: string;
  gameId: string;
  startedAt: Date;
  durationMin?: number;
  mood: string[];
  notes?: string;
};

export interface SessionWithGameResponse extends SessionResponse {
  game: { title: string };
}

export type PlaySessionRelations = Prisma.PlaySessionGetPayload<{
  include: {
    game: {
      include: {
        igdbGame: { select: { title: true } };
      };
    };
  };
}>;
