import { Prisma } from '../../../generated/prisma/client';

export type PlatformResponse = {
  id: string;
  userId: string;
  platform: string;
  externalId: string;
  lastSyncAt?: Date;
};

export type SyncStatusResponse = {
  connected: boolean;
  lastSyncAt?: Date;
};

export type EnqueueResult = {
  queued: boolean;
  reason?: string;
};

export type UserPlatformRelations = Prisma.UserPlatformGetPayload<{
  include: {
    platform: true;
  };
}>;
