import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Queue } from 'bullmq';

import { Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { EnqueueResult, PlatformResponse, RaRecentGame, SyncStatusResponse } from './retroachievements.types';

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
export class RetroAchievementsService {
  private readonly logger = new Logger(RetroAchievementsService.name);
  private readonly BASE_URL = 'https://retroachievements.org/API';

  constructor(
    @InjectQueue('retroachievements-sync') private raQueue: Queue,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private get apiKey(): string {
    return this.config.get<string>('app.retroachievements.apiKey') ?? '';
  }

  private _toResponse(platform: PrismaPlatform): PlatformResponse {
    return {
      id: platform.id,
      userId: platform.userId,
      platform: platform.platform,
      externalId: platform.externalId,
      lastSyncAt: platform.lastSyncAt ?? undefined,
    };
  }

  async getRecentGames(raUsername: string): Promise<RaRecentGame[]> {
    const url = `${this.BASE_URL}/API_GetUserRecentlyPlayedGames.php?z=${encodeURIComponent(raUsername)}&y=${encodeURIComponent(this.apiKey)}&u=${encodeURIComponent(raUsername)}&c=50`;
    const res = await fetch(url);
    if (!res.ok) {
      this.logger.warn(`RA API error for user ${raUsername}: ${res.status}`);
      return [];
    }
    return res.json();
  }

  async connectPlatform(userId: string, raUsername: string): Promise<PlatformResponse> {
    const platform = await this.prisma.userPlatform.upsert({
      where: { userId_platform: { userId, platform: Platform.RETROACHIEVEMENTS } },
      update: { externalId: raUsername },
      create: { userId, platform: Platform.RETROACHIEVEMENTS, externalId: raUsername },
    });
    return this._toResponse(platform);
  }

  async enqueueSync(userId: string): Promise<EnqueueResult> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platform: { userId, platform: Platform.RETROACHIEVEMENTS } },
    });
    if (!platform) return { queued: false, reason: 'RetroAchievements not connected' };
    await this.raQueue.add(
      'sync',
      { userId, raUsername: platform.externalId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
    return { queued: true };
  }

  async getSyncStatus(userId: string): Promise<SyncStatusResponse> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platform: { userId, platform: Platform.RETROACHIEVEMENTS } },
    });
    return { connected: !!platform, lastSyncAt: platform?.lastSyncAt ?? undefined };
  }
}
