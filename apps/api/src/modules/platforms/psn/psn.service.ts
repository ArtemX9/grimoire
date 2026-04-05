import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  getProfileFromUserName,
  getUserPlayedGames,
} from 'psn-api';
import { Queue } from 'bullmq';

import { Platform } from '@grimoire/shared';

import { PrismaService } from '../../../prisma/prisma.service';
import { EnqueueResult, PlatformResponse, PsnTitle, SyncStatusResponse } from './psn.types';

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
export class PsnService {
  private readonly logger = new Logger(PsnService.name);

  constructor(
    @InjectQueue('psn-sync') private psnQueue: Queue,
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

  async getAccessToken(): Promise<{ accessToken: string }> {
    const npsso = this.config.get<string>('app.psn.npsso');
    if (!npsso) throw new Error('PSN_NPSSO not configured');
    const accessCode = await exchangeNpssoForAccessCode(npsso);
    const { accessToken } = await exchangeAccessCodeForAuthTokens(accessCode);
    return { accessToken };
  }

  async getAccountIdFromUsername(authorization: { accessToken: string }, psnUsername: string): Promise<string> {
    const profile = await getProfileFromUserName(authorization, psnUsername);
    return profile.profile.accountId;
  }

  async getPublicUserGames(authorization: { accessToken: string }, accountId: string): Promise<PsnTitle[]> {
    const response = await getUserPlayedGames(authorization, accountId, { limit: 200, offset: 0 });
    return (response.titles ?? []).map((t) => ({
      npTitleId: t.titleId,
      titleName: t.name,
      imageUrl: t.imageUrl,
      category: t.category,
      playCount: t.playCount,
      firstPlayedDateTime: t.firstPlayedDateTime,
      lastPlayedDateTime: t.lastPlayedDateTime,
    }));
  }

  async connectPlatform(userId: string, psnUsername: string): Promise<PlatformResponse> {
    const platform = await this.prisma.userPlatform.upsert({
      where: { userId_platform: { userId, platform: Platform.PSN } },
      update: { externalId: psnUsername },
      create: { userId, platform: Platform.PSN, externalId: psnUsername },
    });
    return this._toResponse(platform);
  }

  async enqueuePsnSync(userId: string): Promise<EnqueueResult> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platform: { userId, platform: Platform.PSN } },
    });
    if (!platform) return { queued: false, reason: 'PSN not connected' };
    await this.psnQueue.add(
      'sync',
      { userId, psnUsername: platform.externalId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
    return { queued: true };
  }

  async getSyncStatus(userId: string): Promise<SyncStatusResponse> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platform: { userId, platform: Platform.PSN } },
    });
    return { connected: !!platform, lastSyncAt: platform?.lastSyncAt ?? undefined };
  }
}
