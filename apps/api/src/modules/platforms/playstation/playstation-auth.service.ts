import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AuthTokensResponse,
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
} from 'psn-api';

import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptorService } from '../../encryptor/encryptor.service';
import { PLATFORM_ID_PLAYSTATION } from './constants';

@Injectable()
export class PlaystationAuthService implements OnModuleInit {
  private readonly logger = new Logger(PlaystationAuthService.name);

  private accessCode?: string;
  private authorization?: AuthTokensResponse;
  private tokenExpiry: number = 0;
  private initialized = false;

  constructor(
    private prisma: PrismaService,
    private encryptorService: EncryptorService,
  ) {}

  async onModuleInit() {
    await this.initializePlatform();
  }

  async initializePlatform() {
    const tokenInfo = await this.prisma.platformsTokens.findUnique({
      where: {
        id: PLATFORM_ID_PLAYSTATION,
      },
    });
    if (!tokenInfo || tokenInfo.dateSet > new Date()) return;
    try {
      this.accessCode = await this._getAccessCode(this.encryptorService.decrypt(tokenInfo.token));
      this.logger.debug('Successfully exchanged NPSSO to Access Code');
      await this._getAuthorization();
      this.initialized = true;
    } catch (err) {
      this.logger.warn(
        `PSN credentials are invalid or the PSN API is unreachable — PlayStation features will be unavailable. ` +
          `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async getAuthorization(): Promise<AuthTokensResponse> {
    if (!this.authorization) {
      throw new ServiceUnavailableException('PSN credentials not configured or invalid — set PSN_NPSSO to use PlayStation features');
    }
    if (Date.now() >= this.tokenExpiry) await this.refreshToken();
    return this.authorization;
  }

  private _getAccessCode(npsso: string) {
    return exchangeNpssoForAccessCode(npsso);
  }

  private async _getAuthorization() {
    if (!this.accessCode) {
      throw new Error('PlaystationAuthService: PSN access code is missing');
    }
    this.authorization = await exchangeAccessCodeForAuthTokens(this.accessCode);
    this.tokenExpiry = Date.now() + this.authorization.expiresIn * 1000;
  }

  private async refreshToken() {
    if (!this.authorization) {
      throw new Error('PlaystationAuthService: authorization data is missing');
    }

    const updatedAuthorization = await exchangeRefreshTokenForAuthTokens(this.authorization.refreshToken);
    this.tokenExpiry = Date.now() + updatedAuthorization.expiresIn * 1000;
    this.authorization = updatedAuthorization;
  }
}
