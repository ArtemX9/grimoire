import { Body, Controller, Get, Post } from '@nestjs/common';

import { User } from '@grimoire/shared';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { IsValidSteamID } from './decorators/steamID.decorator';
import { SteamService } from './steam.service';

@Controller('platforms/steam')
export class SteamController {
  constructor(private steamService: SteamService) {}

  @Post('connect')
  @IsValidSteamID()
  connect(@CurrentUser() user: User, @Body('steamId') steamId: string) {
    return this.steamService.connect(user.id, steamId);
  }

  @Post('sync')
  sync(@CurrentUser() user: User) {
    return this.steamService.enqueueSync(user.id);
  }

  @Get('status')
  status(@CurrentUser() user: User) {
    return this.steamService.getSyncStatus(user.id);
  }
}
