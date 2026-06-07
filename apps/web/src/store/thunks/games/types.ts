import { CreateGameDto, GameStatus, Platform, RemapGameDto, SortableField, UpdateGameDto } from '@grimoire/shared';

export type GameStats = {
  total: number;
  byStatus: Array<{ status: GameStatus; _count: number }>;
  totalHours: number;
};

export type GamesQuery = {
  status?: GameStatus;
  genre?: string;
  platform?: Platform;
  search?: string;
  sortBy?: SortableField;
  order?: 'asc' | 'desc';
};

export type CreateGameArgs = CreateGameDto;

export type UpdateGameArgs = {
  id: string;
  data: UpdateGameDto;
};

export type RemapGameArgs = {
  id: string;
  data: RemapGameDto;
};
