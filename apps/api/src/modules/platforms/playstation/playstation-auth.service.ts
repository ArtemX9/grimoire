import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AuthTokensResponse,
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
} from 'psn-api';

@Injectable()
export class PlaystationAuthService implements OnModuleInit {
  private readonly logger = new Logger(PlaystationAuthService.name);

  private accessCode?: string;
  private authorization?: AuthTokensResponse;
  private tokenExpiry: number = 0;
  private initialized = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const npsso = this.config.get<string>('app.playstation.npsso');
    if (!npsso) return;
    try {
      this.accessCode = await this._getAccessCode();
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

  private _getAccessCode() {
    const npsso = this.config.get('app.playstation.npsso');
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
