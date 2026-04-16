import { faker } from '@faker-js/faker';

import { CreateGameDto, GameStatus, Genre, Mood, RemapGameDto } from '@grimoire/shared';

import { GameResponse } from '../modules/games/games.types';

export interface IGenerateGameResponse {
  id?: string;
  userID?: string;
  igdbID?: number;
  title?: string;
  coverURL?: string;
  genres?: Genre[];
  status?: GameStatus;
  playtimeHours?: number;
  userRating?: number;
  notes?: string;
  moods?: Mood[];
  addedAt?: Date;
  releaseDate?: Date | null;
  updatedAt?: Date;
  isMappedManually?: boolean;
  platforms?: GameResponse['platforms'];
}

export function generateGameResponse(params: IGenerateGameResponse = {}): GameResponse {
  return {
    id: params.id ?? faker.string.uuid(),
    userID: params.userID ?? faker.string.uuid(),
    igdbID: params.igdbID ?? faker.number.int({ min: 1, max: 999999 }),
    title: params.title ?? faker.commerce.productName(),
    coverURL: params.coverURL,
    genres: params.genres ?? [Genre.Action],
    status: params.status ?? GameStatus.BACKLOG,
    playtimeHours: params.playtimeHours ?? 0,
    userRating: params.userRating,
    notes: params.notes,
    moods: params.moods ?? [],
    addedAt: params.addedAt ?? faker.date.past(),
    releaseDate: params.releaseDate !== undefined ? params.releaseDate : null,
    updatedAt: params.updatedAt ?? faker.date.recent(),
    isMappedManually: params.isMappedManually ?? false,
    platforms: params.platforms ?? [],
  };
}

export interface IGenerateCreateGameDto {
  igdbId?: number;
  externalId?: string;
  externalTitle?: string;
  platformId?: number;
  title?: string;
  summary?: string;
  storyLine?: string;
  releaseDate?: Date;
  coverUrl?: string;
  genres?: Genre[];
  status?: GameStatus;
  moods?: Mood[];
  notes?: string;
}

export function generateCreateGameDto(params: IGenerateCreateGameDto = {}): CreateGameDto {
  return {
    igdbId: params.igdbId ?? faker.number.int({ min: 1, max: 999999 }),
    externalId: params.externalId,
    externalTitle: params.externalTitle,
    platformId: params.platformId ?? 1,
    title: params.title ?? faker.commerce.productName(),
    summary: params.summary ?? faker.lorem.sentence(),
    storyLine: params.storyLine ?? faker.lorem.sentence(),
    releaseDate: params.releaseDate ?? faker.date.past(),
    coverUrl: params.coverUrl,
    genres: params.genres ?? [Genre.Action],
    status: params.status ?? GameStatus.BACKLOG,
    moods: params.moods ?? [],
    notes: params.notes,
  };
}

export interface IGenerateRemapGameDto {
  igdbId?: number;
  title?: string;
  coverUrl?: string;
  genres?: Genre[];
  platformId?: number;
}

export function generateRemapGameDto(params: IGenerateRemapGameDto = {}): RemapGameDto {
  return {
    igdbId: params.igdbId ?? faker.number.int({ min: 1, max: 999999 }),
    title: params.title ?? faker.commerce.productName(),
    coverUrl: params.coverUrl,
    genres: params.genres ?? [Genre.Action],
    platformId: params.platformId,
  };
}
