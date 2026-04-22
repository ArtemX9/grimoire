import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AuthTokensResponse,
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
} from 'psn-api';

@Injectable()
export class PlaystationAuthService implements OnModuleInit {
  private accessCode?: string;
  private authorization?: AuthTokensResponse;
  private tokenExpiry: number = 0;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const npsso = this.config.get<string>('app.playstation.npsso');
    if (!npsso) return;
    this.accessCode = await this._getAccessCode();
    console.debug('PlaystationService: Successfully exchanged NPSSO to Access Code');
    await this._getAuthorization();
  }

  async getAuthorization(): Promise<AuthTokensResponse> {
    if (!this.authorization) {
      throw new Error('PSN is not configured — set PSN_NPSSO to use PlayStation features');
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
