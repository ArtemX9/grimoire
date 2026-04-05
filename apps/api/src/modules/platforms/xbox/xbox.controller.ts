import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { XboxService } from './xbox.service';

@Controller('platforms/xbox')
export class XboxController {
  constructor(private xboxService: XboxService) {}

  @Post('connect')
  connect(@CurrentUser() user: any, @Body('gamertag') gamertag: string) {
    return this.xboxService.connectPlatform(user.id, gamertag);
  }

  @Post('sync')
  sync(@CurrentUser() user: any) {
    return this.xboxService.enqueueXboxSync(user.id);
  }

  @Get('status')
  status(@CurrentUser() user: any) {
    return this.xboxService.getSyncStatus(user.id);
  }
}
