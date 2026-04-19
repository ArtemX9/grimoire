import { faker } from '@faker-js/faker';

import { UnmappedReasons } from '@grimoire/shared';

import { UnmappedGameWithRelations } from '../modules/unmapped-games/unmapped-games.types';

export interface IGenerateUnmappedSyncedGame {
  id?: string;
  userId?: string;
  syncedGameId?: string;
  reason?: UnmappedReasons;
  isMapped?: boolean;
  igdbGameId?: number | null;
  playtimeHours?: number;
  createdAt?: Date;
  updatedAt?: Date;
  syncedGame?: UnmappedGameWithRelations['syncedGame'];
}

export function generateUnmappedSyncedGame(params: IGenerateUnmappedSyncedGame = {}): UnmappedGameWithRelations {
  const syncedGameId = params.syncedGameId ?? faker.string.uuid();
  return {
    id: params.id ?? faker.string.uuid(),
    userId: params.userId ?? faker.string.uuid(),
    syncedGameId,
    reason: (params.reason ?? UnmappedReasons.NO_MATCH) as unknown as UnmappedGameWithRelations['reason'],
    isMapped: params.isMapped ?? false,
    igdbGameId: params.igdbGameId !== undefined ? params.igdbGameId : null,
    playtimeHours: params.playtimeHours ?? faker.number.float({ min: 0, max: 500, fractionDigits: 1 }),
    createdAt: params.createdAt ?? faker.date.past(),
    updatedAt: params.updatedAt ?? faker.date.recent(),
    syncedGame: params.syncedGame ?? {
      id: syncedGameId,
      platformId: 1,
      externalId: faker.string.numeric(8),
      externalTitle: faker.commerce.productName(),
      coverUrl: null,
      summary: null,
      platform: { id: 1, platform: 'STEAM' },
    },
  };
}
