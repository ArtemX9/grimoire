import { CreateSessionDto } from '@grimoire/shared';

export type GetRecentSessionsArgs = {
  limit?: number;
};

export type GetGameSessionsArgs = {
  gameId: string;
};

export type CreateSessionArgs = CreateSessionDto;
