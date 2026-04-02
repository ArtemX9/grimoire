import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { SteamService } from './steam.service';

@Controller('platforms/steam')
export class SteamController {
  constructor(private steamService: SteamService) {}

  @Post('connect')
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
