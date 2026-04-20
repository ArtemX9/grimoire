import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Queue } from 'bullmq';
import { UserPlayedGamesResponse, getProfileFromUserName, getUserPlayedGames, makeUniversalSearch } from 'psn-api';

import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformResponse, SyncStatusResponse, UserPlatformRelations } from '../steam/steam.types';
import { GAMES_LIST_LIMIT, PLATFORM_ID_PLAYSTATION, PLAYSTATION_QUEUE_TITLE } from './constants';
import { PlaystationAuthService } from './playstation-auth.service';

@Injectable()
export class PlaystationService {
  constructor(
    @InjectQueue(PLAYSTATION_QUEUE_TITLE) private playstationQueue: Queue,
    private playstationAuth: PlaystationAuthService,
    private prisma: PrismaService,
  ) {}

  async connect(userID: string, username: string) {
    const authorization = await this.playstationAuth.getAuthorization();
    let accountID: string;

    const allAccountsSearchResults = await makeUniversalSearch(authorization, username, 'SocialAllAccounts');

    if (allAccountsSearchResults.domainResponses[0].results.length) {
      accountID = allAccountsSearchResults.domainResponses[0].results[0].socialMetadata.accountId;
    } else {
      const profileData = await getProfileFromUserName(authorization, username);
      if (profileData.profile) {
        accountID = profileData.profile.accountId;
      } else {
        throw new NotFoundException('PSN username not found, make sure you opened your profile to "anyone"');
      }
    }

    const platform = await this.prisma.userPlatform.upsert({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_PLAYSTATION } },
      update: { externalId: accountID },
      create: { userId: userID, platformId: PLATFORM_ID_PLAYSTATION, externalId: accountID },
      include: {
        platform: true,
      },
    });
    return this._toResponse(platform);
  }

  async getSyncStatus(userID: string): Promise<SyncStatusResponse> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: {
        userId_platformId: {
          userId: userID,
          platformId: PLATFORM_ID_PLAYSTATION,
        },
      },
    });

    return { connected: !!platform, lastSyncAt: platform?.lastSyncAt ?? undefined };
  }

  async getOwnedGames(playstationAccountID: string): Promise<UserPlayedGamesResponse['titles']> {
    const authorization = await this.playstationAuth.getAuthorization();
    let offset = 0;
    let shouldLoadMoreGames = false;
    const playedGamesList = [] as UserPlayedGamesResponse['titles'];
    do {
      const gamesResponse = await getUserPlayedGames(authorization, playstationAccountID, { limit: GAMES_LIST_LIMIT, offset });
      playedGamesList.splice(playedGamesList.length, 0, ...gamesResponse.titles);
      shouldLoadMoreGames = gamesResponse.totalItemCount > playedGamesList.length;
      offset += GAMES_LIST_LIMIT;
    } while (shouldLoadMoreGames);
    return playedGamesList;
  }

  async enqueueSync(userID: string) {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_PLAYSTATION } },
    });

    if (!platform) return { queued: false, reason: 'PlayStation platform not connected' };

    await this.playstationQueue.add(
      'sync',
      { userID, psnAccountID: platform.externalId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return { queued: true };
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
