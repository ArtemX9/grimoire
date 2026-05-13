import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Queue } from 'bullmq';

import { PlatformSyncStatus, SteamGame } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { iPlatformService } from '../common/sync-service';
import { EnqueueResult, PlatformResponse, SyncStatusResponse, UserPlatformRelations } from '../common/types';
import { PLATFORM_ID_STEAM, STEAM_QUEUE_TITLE } from './constants';

@Injectable()
export class SteamService implements iPlatformService {
  private readonly logger = new Logger(SteamService.name);

  constructor(
    @InjectQueue(STEAM_QUEUE_TITLE) private steamQueue: Queue,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getOwnedGames(steamId: string): Promise<SteamGame[]> {
    const apiKey = this.config.get('app.steam.apiKey');
    const res = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&format=json`,
    );
    const data = await res.json();
    return data.response?.games ?? [];
  }

  async connect(userId: string, steamId: string): Promise<PlatformResponse> {
    const platform = await this.prisma.userPlatform.upsert({
      where: { userId_platformId: { userId, platformId: PLATFORM_ID_STEAM } },
      update: { externalId: steamId },
      create: { userId, platformId: PLATFORM_ID_STEAM, externalId: steamId },
      include: {
        platform: true,
      },
    });
    return this._toResponse(platform);
  }

  async enqueueSync(userId: string): Promise<EnqueueResult> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platformId: { userId, platformId: PLATFORM_ID_STEAM } },
    });
    if (!platform) return { queued: false, reason: 'Steam platform not connected' };

    try {
      await this.steamQueue.add(
        'sync',
        { userId, steamId: platform.externalId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
      return { queued: true };
    } catch (e) {
      this.logger.error(`${e}`);
      return { queued: false };
    }
  }

  async getSyncStatus(userId: string): Promise<PlatformSyncStatus> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platformId: { userId, platformId: PLATFORM_ID_STEAM } },
    });
    return {
      connected: !!platform,
      lastSyncAt: platform?.lastSyncAt ?? undefined,
      externalID: platform?.externalId,
      isSyncing: platform?.isSyncing ?? undefined,
    };
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
