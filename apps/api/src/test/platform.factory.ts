import { faker } from '@faker-js/faker';

import { Platform } from '@grimoire/shared';

import { PlatformResponse } from '../modules/platforms/steam/steam.types';

export interface IGeneratePlatform {
  id?: string;
  userId?: string;
  platform?: Platform;
  externalId?: string;
  lastSyncAt?: Date;
}

export function generatePlatform(params: IGeneratePlatform = {}): PlatformResponse {
  return {
    id: params.id ?? faker.string.uuid(),
    userId: params.userId ?? faker.string.uuid(),
    platform: params.platform ?? Platform.STEAM,
    externalId: params.externalId ?? faker.string.numeric(17),
    lastSyncAt: params.lastSyncAt,
  };
}

export interface IGenerateUserPlatformRow extends IGeneratePlatform {
  accessToken?: string | null;
  refreshToken?: string | null;
}

export function generateUserPlatformRow(params: IGenerateUserPlatformRow = {}) {
  return {
    id: params.id ?? faker.string.uuid(),
    userId: params.userId ?? faker.string.uuid(),
    platform: params.platform ?? Platform.STEAM,
    externalId: params.externalId ?? faker.string.numeric(17),
    accessToken: params.accessToken !== undefined ? params.accessToken : null,
    refreshToken: params.refreshToken !== undefined ? params.refreshToken : null,
    lastSyncAt: params.lastSyncAt !== undefined ? params.lastSyncAt : null,
  };
}
