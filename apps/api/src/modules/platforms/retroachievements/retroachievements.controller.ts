import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RetroAchievementsService } from './retroachievements.service';

@Controller('platforms/retroachievements')
export class RetroAchievementsController {
  constructor(private raService: RetroAchievementsService) {}

  @Post('connect')
  connect(@CurrentUser() user: any, @Body('raUsername') raUsername: string) {
    return this.raService.connectPlatform(user.id, raUsername);
  }

  @Post('sync')
  sync(@CurrentUser() user: any) {
    return this.raService.enqueueSync(user.id);
  }

  @Get('status')
  status(@CurrentUser() user: any) {
    return this.raService.getSyncStatus(user.id);
  }
}
