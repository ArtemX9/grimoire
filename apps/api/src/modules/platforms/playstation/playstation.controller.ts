import { Controller, Get, Post, Query } from '@nestjs/common';

import { User } from '@grimoire/shared';

import { CurrentUser, RequestUser } from '../../../common/decorators/current-user.decorator';
import { NotDemo } from '../../../common/decorators/not-demo.decorator';
import { PlaystationService } from './playstation.service';

@Controller('platforms/playstation')
export class PlaystationController {
  constructor(private playstationService: PlaystationService) {}

  @Post('connect')
  connect(@CurrentUser() user: RequestUser, @Query('username') username: string) {
    return this.playstationService.connect(user.id, username);
  }

  @Get('status')
  status(@CurrentUser() user: RequestUser) {
    return this.playstationService.getSyncStatus(user.id);
  }

  @Post('sync')
  @NotDemo()
  sync(@CurrentUser() user: RequestUser) {
    return this.playstationService.enqueueSync(user.id);
  }
}
