import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';

import { XSAPIClient } from '@xboxreplay/xboxlive-auth';
import { Queue } from 'bullmq';

import { PlatformSyncStatus } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { iPlatformService } from '../common/sync-service';
import { EnqueueResult, PlatformResponse, SyncStatusResponse, UserPlatformRelations } from '../common/types';
import { PLATFORM_ID_XBOX, XBOX_QUEUE_TITLE } from './constants';
import { XboxGame } from './types';
import { XboxAuthService } from './xbox-auth.service';

@Injectable()
export class XboxService implements iPlatformService {
  private readonly logger = new Logger(XboxService.name);

  constructor(
    @InjectQueue(XBOX_QUEUE_TITLE) private xboxQueue: Queue,
    private xboxAuth: XboxAuthService,
    private prisma: PrismaService,
  ) {}

  async connect(userID: string): Promise<PlatformResponse> {
    const token = await this.xboxAuth.getValidToken(userID);

    const platform = await this.prisma.userPlatform.upsert({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_XBOX } },
      update: { externalId: token.xboxUserID },
      create: { userId: userID, platformId: PLATFORM_ID_XBOX, externalId: token.xboxUserID },
      include: { platform: true },
    });

    return this._toResponse(platform);
  }
  async getSyncStatus(userID: string): Promise<PlatformSyncStatus> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: {
        userId_platformId: {
          userId: userID,
          platformId: PLATFORM_ID_XBOX,
        },
      },
    });

    return {
      connected: !!platform,
      lastSyncAt: platform?.lastSyncAt ?? undefined,
      externalID: platform?.externalId,
      isSyncing: platform?.isSyncing ?? undefined,
    };
  }

  async enqueueSync(userID: string): Promise<EnqueueResult> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_XBOX } },
    });

    if (!platform) return { queued: false, reason: 'Xbox platform not connected' };

    try {
      await this.xboxQueue.add(
        'sync',
        { userID, xboxAccountID: platform.externalId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
      return { queued: true };
    } catch (e) {
      this.logger.error(`${e}`);
      return { queued: false };
    }
  }

  async getOwnedGames(userID: string) {
    const token = await this.xboxAuth.getValidToken(userID);

    try {
      const response = await XSAPIClient.get(
        `https://titlehub.xboxlive.com/users/xuid(${token.xboxUserID})/titles/titleHistory/decoration/Achievement,Image`,
        {
          options: { contractVersion: 2, userHash: token.userHash, XSTSToken: token.token },
        },
      );

      return (response.data.titles as XboxGame[]) ?? [];
    } catch (e) {
      this.logger.error(`${e}`);
      throw new UnprocessableEntityException(e);
    }
  }

  private _toResponse(platform: UserPlatformRelations): PlatformResponse {
    return {
      id: platform.id,
      userId: platform.userId,
      platform: platform.platform.platform,
      externalId: platform.externalId,
      lastSyncAt: platform.lastSyncAt ?? undefined,
    };
  }
}
