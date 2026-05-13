import { randomUUID } from 'node:crypto';

import { BadRequestException, Controller, Get, Post, Query, Redirect, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CurrentUser, RequestUser } from '../../../common/decorators/current-user.decorator';
import { NotDemo } from '../../../common/decorators/not-demo.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { XboxAuthService } from './xbox-auth.service';
import { XboxService } from './xbox.service';

@Controller('platforms/xbox')
export class XboxController {
  constructor(
    private xboxService: XboxService,
    private xboxAuthService: XboxAuthService,
    private config: ConfigService,
  ) {}

  // First step of auth for user - generating URL and redirecting user to authorize app integration
  @Get('connect/redirect')
  @Redirect()
  connectRedirect(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const uniqueConnectRequestID = randomUUID();
    this.xboxAuthService.setPendingState(uniqueConnectRequestID, user.id);
    return { url: this.xboxAuthService.getAuthorizationURL(uniqueConnectRequestID) };
  }

  // Second step of auth - Microsoft calls when user has authorized app
  // We obtain tokens and connect to platform
  @Get('connect/callback')
  @Public()
  @Redirect()
  async connectCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    if (error) {
      throw new BadRequestException(errorDescription);
    }
    const userID = this.xboxAuthService.consumePendingState(state);
    if (!userID) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }
    await this.xboxAuthService.exchangeCodeForLiveTokens(code, userID);
    await this.xboxAuthService.getXSTSTokenForUser(userID);

    await this.xboxService.connect(userID);
    const frontendURI = this.config.get<string>('app.xbox.frontendRedirectURI')!;
    return { url: frontendURI };
  }

  @Get('status')
  status(@CurrentUser() user: RequestUser) {
    return this.xboxService.getSyncStatus(user.id);
  }

  @Get('ownedGames')
  getOwnedGames(@CurrentUser() user: RequestUser) {
    return this.xboxService.getOwnedGames(user.id);
  }

  @Post('sync')
  @NotDemo()
  sync(@CurrentUser() user: RequestUser) {
    return this.xboxService.enqueueSync(user.id);
  }
}
