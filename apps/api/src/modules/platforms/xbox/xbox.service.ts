import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../prisma/prisma.service';
import { iPlatformService } from '../common/sync-service';
import { EnqueueResult, PlatformResponse, SyncStatusResponse, UserPlatformRelations } from '../common/types';
import { PLATFORM_ID_XBOX } from './constants';
import { XboxAuthService } from './xbox-auth.service';

@Injectable()
export class XboxService implements iPlatformService {
  constructor(
    private xboxAuth: XboxAuthService,
    private config: ConfigService,
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
  getSyncStatus(userID: string): Promise<SyncStatusResponse> {
    throw new Error('Method not implemented.');
  }
  enqueueSync(userID: string): Promise<EnqueueResult> {
    throw new Error('Method not implemented.');
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
