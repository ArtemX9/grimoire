import { GameStatus } from '@grimoire/shared';

export interface GameResponse {
  id: string;
  userID: string;
  igdbID: number;
  steamAppID?: number;
  title: string;
  coverURL?: string;
  genres: string[];
  status: GameStatus;
  playtimeHours: number;
  userRating?: number;
  notes?: string;
  moods: string[];
  addedAt: Date;
  updatedAt: Date;
}

export interface GameStatsResponse {
  total: number;
  byStatus: Array<{ status: string; _count: number }>;
  totalHours: number;
}
