import { Controller, Get, Post, Query } from '@nestjs/common';

import { User } from '@grimoire/shared';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PlaystationService } from './playstation.service';

@Controller('platforms/playstation')
export class PlaystationController {
  constructor(private playstationService: PlaystationService) {}

  @Post('connect')
  connect(@CurrentUser() user: User, @Query('username') username: string) {
    return this.playstationService.connect(user.id, username);
  }

  @Get('status')
  status(@CurrentUser() user: User) {
    return this.playstationService.getSyncStatus(user.id);
  }

  @Post('sync')
  sync(@CurrentUser() user: User) {
    return this.playstationService.enqueueSync(user.id);
  }
}
