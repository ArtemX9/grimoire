import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PsnService } from './psn.service';

@Controller('platforms/psn')
export class PsnController {
  constructor(private psnService: PsnService) {}

  @Post('connect')
  connect(@CurrentUser() user: any, @Body('psnUsername') psnUsername: string) {
    return this.psnService.connectPlatform(user.id, psnUsername);
  }

  @Post('sync')
  sync(@CurrentUser() user: any) {
    return this.psnService.enqueuePsnSync(user.id);
  }

  @Get('status')
  status(@CurrentUser() user: any) {
    return this.psnService.getSyncStatus(user.id);
  }
}
