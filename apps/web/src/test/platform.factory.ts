import { faker } from '@faker-js/faker';
import { Platform, UserPlatform } from '@grimoire/shared';
import type { PlatformType } from '@grimoire/shared';

// ---------------------------------------------------------------------------
// UserPlatform (shared type — a connected platform for a user)
// ---------------------------------------------------------------------------

export interface IGenerateUserPlatform {
  id?: string;
  userID?: string;
  platform?: PlatformType;
  externalID?: string;
  lastSyncAt?: Date;
}

export function generateUserPlatform(params: IGenerateUserPlatform = {}): UserPlatform {
  return {
    id: params.id ?? faker.string.uuid(),
    userID: params.userID ?? faker.string.uuid(),
    platform: params.platform ?? { id: faker.number.int({ min: 1, max: 10 }), platform: Platform.STEAM },
    externalID: params.externalID ?? faker.string.numeric(10),
    lastSyncAt: params.lastSyncAt,
  };
}
