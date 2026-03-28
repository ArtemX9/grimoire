import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Queue } from 'bullmq';

import { Platform, SteamGame } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { EnqueueResult, PlatformResponse, SyncStatusResponse } from './steam.types';

type PrismaPlatform = {
  id: string;
  userId: string;
  platform: string;
  externalId: string;
  accessToken: string | null;
  refreshToken: string | null;
  lastSyncAt: Date | null;
};

@Injectable()
export class SteamService {
  constructor(
    @InjectQueue('steam-sync') private steamQueue: Queue,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private _toResponse(platform: PrismaPlatform): PlatformResponse {
    return {
      id: platform.id,
      userId: platform.userId,
      platform: platform.platform,
      externalId: platform.externalId,
      lastSyncAt: platform.lastSyncAt ?? undefined,
    };
  }

  async getOwnedGames(steamId: string): Promise<SteamGame[]> {
    const apiKey = this.config.get('app.steam.apiKey');
    const res = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&format=json`,
    );
    const data = await res.json();
    return data.response?.games ?? [];
  }

  async connectPlatform(userId: string, steamId: string): Promise<PlatformResponse> {
    const platform = await this.prisma.userPlatform.upsert({
      where: { userId_platform: { userId, platform: Platform.STEAM } },
      update: { externalId: steamId },
      create: { userId, platform: Platform.STEAM, externalId: steamId },
    });
    return this._toResponse(platform);
  }

  async enqueueSteamSync(userId: string): Promise<EnqueueResult> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platform: { userId, platform: Platform.STEAM } },
    });
    if (!platform) return { queued: false, reason: 'Steam not connected' };
    await this.steamQueue.add(
      'sync',
      { userId, steamId: platform.externalId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
    return { queued: true };
  }

  async getSyncStatus(userId: string): Promise<SyncStatusResponse> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platform: { userId, platform: Platform.STEAM } },
    });
    return { connected: !!platform, lastSyncAt: platform?.lastSyncAt ?? undefined };
  }
}
