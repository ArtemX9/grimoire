import { GameStatus, Genre, Mood, Platform, Theme } from '@grimoire/shared';

import { Prisma } from '../../generated/prisma/client';

export type GameResponse = {
  id: string;
  userID: string;
  igdbID: number;
  title: string;
  coverURL?: string;
  genres: Genre[];
  status: GameStatus;
  playtimeHours: number;
  moods: Mood[];
  addedAt: Date;
  releaseDate: Date | null;
  updatedAt: Date;
  themes: Theme[];
  isMappedManually: boolean;
  platforms: {
    platformID: number;
    platformName: Platform;
    externalID: string;
    externalTitle: string;
  }[];
  summary?: string;
  storyLine?: string;
  userRating?: number;
  notes?: string;
};

export interface GameStatsResponse {
  total: number;
  byStatus: Array<{ status: string; _count: number }>;
  totalHours: number;
}

export type UserGameWithRelations = Prisma.UserGameGetPayload<{
  include: {
    igdbGame: true;
    userGamePlatforms: {
      include: {
        syncedGame: {
          include: {
            platform: {
              select: {
                id: true;
                platform: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export type IngestedSyncGameInfo = {
  id: string;
  platformID: number;
  externalTitle?: string;
  coverURL?: string;
  summary?: string;
  playtimeHours?: number;
  isManualMapping?: boolean;
};

export type IgdbSyncGameInfo = {
  id: number;
  title: string;
  coverURL: string;
  genres: Genre[];
  summary?: string;
  storyLine?: string;
  releaseDate?: Date;
  themes: Theme[];
};
