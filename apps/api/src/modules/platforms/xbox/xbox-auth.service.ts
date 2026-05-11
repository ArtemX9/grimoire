import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { XNETExchangeTokensResponse, live, xnet } from '@xboxreplay/xboxlive-auth';

import { PrismaService } from '../../../prisma/prisma.service';
import { PLATFORM_ID_XBOX, XBOX_RESPONSE_TYPE, XBOX_SCOPE } from './constants';

@Injectable()
export class XboxAuthService {
  private readonly tokenCache = new Map<string, { accessToken: string; expiresAt: number }>();
  private readonly pendingStates = new Map<string, { userID: string; expiresAt: number }>();

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  getAuthorizationURL(state: string) {
    const clientID = this.config.get<string>('app.xbox.clientID')!;
    const redirectURI = this.config.get<string>('app.xbox.redirectURI')!;
    const base = live.getAuthorizeUrl(clientID, XBOX_SCOPE, XBOX_RESPONSE_TYPE, redirectURI);
    return `${base}&state=${state}`;
  }

  async exchangeCodeForLiveTokens(code: string) {
    const clientID = this.config.get<string>('app.xbox.clientID')!;
    const clientSecret = this.config.get<string>('app.xbox.clientSecret')!;
    const redirectURI = this.config.get<string>('app.xbox.redirectURI')!;
    return live.exchangeCodeForAccessToken(code, clientID, XBOX_SCOPE, redirectURI, clientSecret);
  }

  async getXSTSTokenForUser(userID: string): Promise<XNETExchangeTokensResponse> {
    const platform = await this.prisma.userPlatform.findUnique({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_XBOX } },
    });
    if (!platform?.refreshToken) {
      throw new UnauthorizedException('Xbox not connected');
    }

    const accessToken = await this._getOrRefreshAccessToken(userID, platform.refreshToken);
    const userToken = await xnet.exchangeRpsTicketForUserToken(`d=${accessToken}`);

    return xnet.exchangeTokensForXSTSToken({ userTokens: [userToken.Token] });
  }

  setPendingState(state: string, userID: string) {
    this.pendingStates.set(state, { userID, expiresAt: Date.now() + 10 * 60 * 1000 });
  }

  consumePendingState(state: string): string | undefined {
    const entry = this.pendingStates.get(state);
    this.pendingStates.delete(state);
    if (!entry || Date.now() > entry.expiresAt) {
      return undefined;
    }
    return entry.userID;
  }

  private async _getOrRefreshAccessToken(userID: string, storedRefreshToken: string): Promise<string> {
    const cached = this.tokenCache.get(userID);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.accessToken;
    }

    const clientID = this.config.get<string>('app.xbox.clientID')!;
    const clientSecret = this.config.get<string>('app.xbox.clientSecret')!;
    const liveAuth = await live.refreshAccessToken(storedRefreshToken, clientID, XBOX_SCOPE, clientSecret);

    // Persist the rotated refresh token
    await this.prisma.userPlatform.update({
      where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_XBOX } },
      data: { refreshToken: liveAuth.refresh_token },
    });

    // Cache the access token with a 5-minute safety margin
    this.tokenCache.set(userID, {
      accessToken: liveAuth.access_token,
      expiresAt: Date.now() + (liveAuth.expires_in - 300) * 1000,
    });

    return liveAuth.access_token;
  }
}
