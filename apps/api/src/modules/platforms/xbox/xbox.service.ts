import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Queue } from 'bullmq';

import { Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { EnqueueResult, OpenXblGamesResponse, OpenXblSearchResponse, PlatformResponse, SyncStatusResponse, XboxTitle } from './xbox.types';

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
export class XboxService {
  private readonly logger = new Logger(XboxService.name);
  private readonly BASE_URL = 'https://xbl.io/api/v2';

  constructor(
    @InjectQueue('xbox-sync') private xboxQueue: Queue,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private get apiKey(): string {
    return this.config.get<string>('app.xbox.openXblApiKey') ?? '';
  }

  private headers() {
    return { 'X-Authorization': this.apiKey, 'Content-Type': 'application/json' };
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

  async getXuidByGamertag(gamertag: string): Promise<string | null> {
    const res = await fetch(
      `${this.BASE_URL}/friends/search?gt=${encodeURIComponent(gamertag)}`,
      { headers: this.headers() },
    );
    if (!res.ok) return null;
    const data: OpenXblSearchResponse = await res.json();
    return data.profileUsers?.[0]?.id ?? null;
  }

  async getUserTitles(xuid: string): Promise<XboxTitle[]> {
    const res = await fetch(
      `${this.BASE_URL}/achievements/player/${xuid}`,
      { headers: this.headers() },
    );
    if (!res.ok) {
      this.logger.warn(`OpenXBL titles fetch failed for xuid ${xuid}: ${res.status}`);
      return [];
    }
    const data: OpenXblGamesResponse = await res.json();
    return data.titles ?? [];
  }

  async connectPlatform(userId: string, gamertag: string): Promise<PlatformResponse> {
    const platform = await this.prisma.userPlatform.upsert({
      where: { userId_platform: { userId, platform: Platform.XBOX } },
      update: { externalId: gamertag },
      create: { userId, platform: Platform.XBOX, externalId: gamertag },
    });
    return this._toResponse(platform);
  }

  async enqueueXboxSync(userId: string): Promise<EnqueueResult> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platform: { userId, platform: Platform.XBOX } },
    });
    if (!platform) return { queued: false, reason: 'Xbox not connected' };
    await this.xboxQueue.add(
      'sync',
      { userId, gamertag: platform.externalId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
    return { queued: true };
  }

  async getSyncStatus(userId: string): Promise<SyncStatusResponse> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platform: { userId, platform: Platform.XBOX } },
    });
    return { connected: !!platform, lastSyncAt: platform?.lastSyncAt ?? undefined };
  }
}
