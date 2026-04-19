import { Prisma } from '../../generated/prisma/client';

export type UnmappedGameWithRelations = Prisma.UnmappedSyncedGameGetPayload<{
  include: {
    syncedGame: {
      include: {
        platform: true;
      };
    };
  };
}>;
