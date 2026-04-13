import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SteamService } from './steam.service';
import {IsValidSteamID} from './decorators/steamID.decorator';

@Controller('platforms/steam')
export class SteamController {
  constructor(private steamService: SteamService) {}

  @Post('connect')
  @IsValidSteamID()
  connect(@CurrentUser() user: any, @Body('steamId') steamId: string) {
    return this.steamService.connectPlatform(user.id, steamId);
  }

  @Post('sync')
  sync(@CurrentUser() user: any) {
    return this.steamService.enqueueSteamSync(user.id);
  }

  @Get('status')
  status(@CurrentUser() user: any) {
    return this.steamService.getSyncStatus(user.id);
  }
}
