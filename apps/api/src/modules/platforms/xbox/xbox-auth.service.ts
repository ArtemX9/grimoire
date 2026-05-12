import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { live, xnet } from '@xboxreplay/xboxlive-auth';

import { PrismaService } from '../../../prisma/prisma.service';
import { PLATFORM_ID_XBOX, XBOX_RESPONSE_TYPE, XBOX_SCOPE } from './constants';

export type TokensInfo = {
  xboxUserID: string;
  token: string;
  userHash: string;
};

@Injectable()
export class XboxAuthService {
  // XSTS Tokens per user
  private readonly tokenCache = new Map<
    string,
    {
      // microsoft live
      refreshToken: string | null;
      accessToken: string | null;
      userID: string;
      // microsoft xbox
      xboxUserID?: string;
      expiresAt?: string;
      userHash?: string;
      XSTSToken?: string;
    }
  >();

  // Unique Connect Request ID - to particular user info
  private readonly pendingStates = new Map<string, { userID: string; expiresAt: number }>();

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  // 1 step - Generate the URL where users will authenticate
  getAuthorizationURL(state: string) {
    const clientID = this.config.get<string>('app.xbox.clientID')!;
    const redirectURI = this.config.get<string>('app.xbox.redirectURI')!;
    const base = live.getAuthorizeUrl(clientID, XBOX_SCOPE, XBOX_RESPONSE_TYPE, redirectURI);
    return `${base}&state=${state}`;
  }

  // 2 step -Exchange the authorization code for access and refresh tokens
  async exchangeCodeForLiveTokens(code: string, userID: string) {
    const clientID = this.config.get<string>('app.xbox.clientID')!;
    const clientSecret = this.config.get<string>('app.xbox.clientSecret')!;
    const redirectURI = this.config.get<string>('app.xbox.redirectURI')!;
    const liveAuth = await live.exchangeCodeForAccessToken(code, clientID, XBOX_SCOPE, redirectURI, clientSecret);

    this.tokenCache.set(userID, {
      accessToken: liveAuth.access_token,
      refreshToken: liveAuth.refresh_token,
      userID: liveAuth.user_id,
    });

    return;
  }

  // 3 step - Convert the access token to Xbox Network tokens
  async getXSTSTokenForUser(userID: string) {
    const userTokenCache = this.tokenCache.get(userID);
    if (!userTokenCache?.accessToken) {
      throw new UnauthorizedException('Xbox not connected');
    }
    try {
      const userToken = await xnet.exchangeRpsTicketForUserToken(userTokenCache.accessToken, 'd');

      const tokens = await xnet.exchangeTokensForXSTSToken({ userTokens: [userToken.Token] });
      const accessToken = tokens.Token;

      if (!tokens.DisplayClaims.xui[0].xid) {
        throw new UnauthorizedException('User does not have any id in Xbox system');
      }
      await this.prisma.userPlatform.upsert({
        where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_XBOX } },
        create: {
          userId: userID,
          platformId: PLATFORM_ID_XBOX,
          refreshToken: userTokenCache.refreshToken,
          // We try to get the Game Tag, if not present - use Xbox ID
          // @ts-ignore
          externalId: tokens.DisplayClaims.xui[0].gtg ?? tokens.DisplayClaims.xui[0].xid,
          accessToken,
        },
        update: {
          refreshToken: userTokenCache.refreshToken,
          // We try to get the Game Tag, if not present - use Xbox ID
          // @ts-ignore
          externalId: tokens.DisplayClaims.xui[0].gtg ?? tokens.DisplayClaims.xui[0].xid,
          accessToken,
        },
        include: {
          platform: true,
        },
      });

      this.tokenCache.set(userID, {
        ...userTokenCache,
        xboxUserID: tokens.DisplayClaims.xui[0]?.xid,
        userHash: tokens.DisplayClaims.xui[0]?.uhs,
        XSTSToken: accessToken,
        expiresAt: tokens.NotAfter,
      });
    } catch (e) {
      throw new UnprocessableEntityException(e);
    }
  }

  setPendingState(uniqueConnectRequestID: string, userID: string) {
    this.pendingStates.set(uniqueConnectRequestID, { userID, expiresAt: Date.now() + 10 * 60 * 1000 });
  }

  consumePendingState(state: string): string | undefined {
    const entry = this.pendingStates.get(state);
    this.pendingStates.delete(state);
    if (!entry || Date.now() > entry.expiresAt) {
      return undefined;
    }
    return entry.userID;
  }

  async getValidToken(userID: string): Promise<TokensInfo> {
    const cached = this.tokenCache.get(userID);
    if (cached?.expiresAt && new Date() < new Date(cached.expiresAt) && cached.xboxUserID && cached.XSTSToken && cached.userHash) {
      return {
        xboxUserID: cached.xboxUserID,
        token: cached.XSTSToken,
        userHash: cached.userHash,
      };
    }

    let refreshToken = cached?.refreshToken;
    if (!refreshToken) {
      const userPlatformInfo = await this.prisma.userPlatform.findUniqueOrThrow({
        where: {
          userId_platformId: {
            userId: userID,
            platformId: PLATFORM_ID_XBOX,
          },
        },
      });

      refreshToken = userPlatformInfo.refreshToken as string;
    }

    return this.refreshTokens(userID, refreshToken);
  }

  private async refreshTokens(userID: string, refreshToken: string): Promise<TokensInfo> {
    const clientID = this.config.get<string>('app.xbox.clientID')!;
    const clientSecret = this.config.get<string>('app.xbox.clientSecret')!;

    const liveAuth = await live.refreshAccessToken(refreshToken, clientID, XBOX_SCOPE, clientSecret);

    if (!liveAuth.refresh_token) {
      throw new UnauthorizedException("Couldn't obtain access token from Microsoft Live service");
    }

    this.tokenCache.set(userID, { accessToken: liveAuth.access_token, refreshToken: liveAuth.refresh_token, userID: liveAuth.user_id });

    try {
      const userToken = await xnet.exchangeRpsTicketForUserToken(liveAuth.access_token, 'd');

      const tokens = await xnet.exchangeTokensForXSTSToken({ userTokens: [userToken.Token] });
      const accessToken = tokens.Token;

      const userTokenCache = this.tokenCache.get(userID);

      if (userTokenCache) {
        this.tokenCache.set(userID, {
          ...userTokenCache,
          xboxUserID: tokens.DisplayClaims.xui[0]?.xid,
          userHash: tokens.DisplayClaims.xui[0]?.uhs,
          XSTSToken: tokens.Token,
          expiresAt: tokens.NotAfter,
        });
      }

      // Persist the rotated refresh token
      await this.prisma.userPlatform.update({
        where: { userId_platformId: { userId: userID, platformId: PLATFORM_ID_XBOX } },
        data: { refreshToken: liveAuth.refresh_token, accessToken },
      });

      if (!tokens.DisplayClaims.xui[0]?.xid || !tokens.Token || !tokens.DisplayClaims.xui[0]?.uhs) {
        throw new UnauthorizedException("Couldn't authorize in Xbox service");
      }

      return {
        xboxUserID: tokens.DisplayClaims.xui[0]?.xid,
        token: tokens.Token,
        userHash: tokens.DisplayClaims.xui[0]?.uhs,
      };
    } catch (e) {
      throw new UnprocessableEntityException(e);
    }
  }
}
