import { faker } from '@faker-js/faker';
import { Job } from 'bullmq';

import { Genre } from '@grimoire/shared';
// ---------------------------------------------------------------------------
// PlayStation platform row (Prisma UserPlatform with platform relation)
// ---------------------------------------------------------------------------

import { Platform } from '@grimoire/shared';

import { PLATFORM_ID_PLAYSTATION } from '../modules/platforms/playstation/constants';
import { generateUserPlatformRow } from './platform.factory';

// ---------------------------------------------------------------------------
// PSN Authorization
// ---------------------------------------------------------------------------

export interface IGeneratePsnAuthorization {
  accessToken?: string;
  expiresIn?: number;
}

export function generatePsnAuthorization(params: IGeneratePsnAuthorization = {}) {
  return {
    accessToken: params.accessToken ?? faker.string.alphanumeric(32),
    expiresIn: params.expiresIn ?? 3600,
  };
}

// ---------------------------------------------------------------------------
// PSN Universal Search result
// ---------------------------------------------------------------------------

export interface IGeneratePsnUniversalSearchResult {
  accountID?: string;
}

export function generatePsnUniversalSearchResult(params: IGeneratePsnUniversalSearchResult = {}) {
  return {
    domainResponses: [
      {
        results: [
          {
            socialMetadata: { accountId: params.accountID ?? faker.string.uuid() },
          },
        ],
      },
    ],
  };
}

export function generateEmptyPsnUniversalSearchResult() {
  return {
    domainResponses: [
      {
        results: [],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// PSN Game (UserPlayedGamesResponse title entry)
// ---------------------------------------------------------------------------

export interface IGeneratePsnGame {
  titleId?: string;
  name?: string;
  localizedName?: string;
  imageURL?: string;
  localizedImageURL?: string;
  category?: string;
  service?: string;
  playCount?: number;
  conceptID?: number;
  firstPlayedDateTime?: string;
  lastPlayedDateTime?: string;
  playDuration?: string;
}

export function generatePsnGame(params: IGeneratePsnGame = {}) {
  const conceptID = params.conceptID ?? faker.number.int({ min: 10000000, max: 99999999 });
  const titleId = params.titleId ?? `CUSA${faker.string.numeric(5)}_00`;
  const name = params.name ?? faker.commerce.productName();
  const imageURL = params.imageURL ?? `https://image.example.com/${faker.lorem.slug()}.jpg`;

  return {
    titleId,
    name,
    localizedName: params.localizedName ?? name,
    imageUrl: imageURL,
    localizedImageUrl: params.localizedImageURL ?? imageURL,
    category: params.category ?? 'ps4_game',
    service: params.service ?? 'none',
    playCount: params.playCount ?? faker.number.int({ min: 1, max: 100 }),
    concept: {
      id: conceptID,
      titleIds: [titleId],
      name,
      media: { audios: [], videos: [], images: [] },
    },
    media: {},
    firstPlayedDateTime: params.firstPlayedDateTime ?? '2020-01-01T00:00:00Z',
    lastPlayedDateTime: params.lastPlayedDateTime ?? '2024-01-01T00:00:00Z',
    playDuration: params.playDuration ?? 'PT10H30M0S',
  };
}

// ---------------------------------------------------------------------------
// IGDB Game (IgdbService.search result entry)
// ---------------------------------------------------------------------------

export interface IGenerateIgdbSearchResult {
  id?: number;
  name?: string;
  cover?: string | undefined;
  genres?: Genre[];
  summary?: string;
  storyline?: string | undefined;
  first_release_date?: number | undefined;
}

export function generateIgdbSearchResult(params: IGenerateIgdbSearchResult = {}) {
  return {
    id: params.id ?? faker.number.int({ min: 1, max: 999999 }),
    name: params.name ?? faker.commerce.productName(),
    cover: 'cover' in params ? params.cover : `//images.igdb.com/${faker.lorem.slug()}.jpg`,
    genres: params.genres ?? [Genre.Action],
    summary: params.summary ?? faker.lorem.sentence(),
    storyline: params.storyline,
    first_release_date: params.first_release_date,
  };
}

// ---------------------------------------------------------------------------
// BullMQ Job (PlayStation sync)
// ---------------------------------------------------------------------------

export interface IGeneratePsnSyncJob {
  userID?: string;
  psnAccountID?: string;
}

export function generatePsnSyncJob(params: IGeneratePsnSyncJob = {}): Job<{ userID: string; psnAccountID: string }> {
  return {
    data: {
      userID: params.userID ?? faker.string.uuid(),
      psnAccountID: params.psnAccountID ?? faker.string.uuid(),
    },
  } as Job<{ userID: string; psnAccountID: string }>;
}

export interface IGeneratePlaystationPlatformRow {
  id?: string;
  userID?: string;
  externalId?: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  lastSyncAt?: Date | null;
}

export function generatePlaystationPlatformRow(params: IGeneratePlaystationPlatformRow = {}) {
  const base = generateUserPlatformRow({
    id: params.id,
    userId: params.userID,
    platform: Platform.PlayStation,
    externalId: params.externalId,
    accessToken: params.accessToken,
    refreshToken: params.refreshToken,
  });
  return {
    ...base,
    // Override lastSyncAt to support null (Prisma DB value) vs undefined (not provided)
    lastSyncAt: params.lastSyncAt !== undefined ? params.lastSyncAt : base.lastSyncAt,
    platformId: PLATFORM_ID_PLAYSTATION,
    platform: { id: PLATFORM_ID_PLAYSTATION, platform: 'PLAYSTATION' },
  };
}
