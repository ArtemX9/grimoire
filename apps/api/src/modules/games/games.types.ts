export interface GameResponse {
  id: string;
  userId: string;
  igdbId: number;
  steamAppId?: number;
  title: string;
  coverUrl?: string;
  genres: string[];
  status: string;
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
