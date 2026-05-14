import { faker } from '@faker-js/faker';
import {
  GameStatus,
  Genre,
  IgdbGame,
  Mood,
  Platform,
  PlatformType,
  Theme,
  UnmappedGame,
  UnmappedReasons,
  UserGame,
} from '@grimoire/shared';
import type { GamePlatform } from '@grimoire/shared';

// ---------------------------------------------------------------------------
// UserGame (shared type — the primary game shape used in the library)
// ---------------------------------------------------------------------------

export interface IGenerateUserGame {
  id?: string;
  userID?: string;
  igdbID?: number;
  title?: string;
  coverURL?: string;
  genres?: Genre[];
  themes?: Theme[];
  status?: GameStatus;
  playtimeHours?: number;
  userRating?: number;
  notes?: string;
  moods?: Mood[];
  addedAt?: Date;
  releaseDate?: Date | null;
  updatedAt?: Date;
  isMappedManually?: boolean;
  platforms?: GamePlatform[];
  summary?: string;
  storyLine?: string;
}

export function generateUserGame(params: IGenerateUserGame = {}): UserGame {
  return {
    id: params.id ?? faker.string.uuid(),
    userID: params.userID ?? faker.string.uuid(),
    igdbID: params.igdbID ?? faker.number.int({ min: 1, max: 999999 }),
    title: params.title ?? faker.commerce.productName(),
    coverURL: params.coverURL,
    genres: params.genres ?? [faker.helpers.enumValue(Genre)],
    themes: params.themes ?? [],
    status: params.status ?? GameStatus.BACKLOG,
    playtimeHours: params.playtimeHours ?? faker.number.int({ min: 0, max: 500 }),
    userRating: params.userRating,
    notes: params.notes,
    moods: params.moods ?? [],
    addedAt: params.addedAt ?? faker.date.past(),
    releaseDate: params.releaseDate !== undefined ? params.releaseDate : null,
    updatedAt: params.updatedAt ?? faker.date.recent(),
    isMappedManually: params.isMappedManually ?? false,
    platforms: params.platforms ?? [],
    summary: params.summary,
    storyLine: params.storyLine,
  };
}

// ---------------------------------------------------------------------------
// IgdbGame (shared type — the search result shape from the IGDB API)
// ---------------------------------------------------------------------------

export interface IGenerateIgdbGame {
  id?: number;
  name?: string;
  summary?: string;
  first_release_date?: number;
  cover?: string;
  genres?: Genre[];
  total_rating?: number;
}

export function generateIgdbGame(params: IGenerateIgdbGame = {}): IgdbGame {
  return {
    id: params.id ?? faker.number.int({ min: 1, max: 999999 }),
    name: params.name ?? faker.commerce.productName(),
    summary: params.summary,
    first_release_date: params.first_release_date,
    cover: params.cover,
    genres: params.genres,
    total_rating: params.total_rating,
  };
}

// ---------------------------------------------------------------------------
// UnmappedGame (shared type — games that failed to auto-map during sync)
// ---------------------------------------------------------------------------

export interface IGenerateUnmappedGame {
  id?: string;
  syncedGameID?: string;
  isMapped?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  reason?: UnmappedReasons;
  platform?: PlatformType;
  syncedGameTitle?: string;
  playtimeHours?: number;
  coverURL?: string;
}

export function generateUnmappedGame(params: IGenerateUnmappedGame = {}): UnmappedGame {
  return {
    id: params.id ?? faker.string.uuid(),
    syncedGameID: params.syncedGameID ?? faker.string.uuid(),
    isMapped: params.isMapped ?? false,
    createdAt: params.createdAt ?? faker.date.past(),
    updatedAt: params.updatedAt ?? faker.date.recent(),
    reason: params.reason ?? UnmappedReasons.NO_MATCH,
    platform: params.platform ?? { id: 1, platform: Platform.STEAM },
    syncedGameTitle: params.syncedGameTitle ?? faker.commerce.productName(),
    playtimeHours: params.playtimeHours ?? faker.number.float({ min: 0, max: 500, fractionDigits: 1 }),
    coverURL: params.coverURL,
  };
}
