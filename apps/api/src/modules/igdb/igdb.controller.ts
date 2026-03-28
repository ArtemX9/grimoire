import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../common/guards/auth.guard';
import { IgdbService } from './igdb.service';

@Controller('igdb')
@UseGuards(AuthGuard)
export class IgdbController {
  constructor(private igdbService: IgdbService) {}

  @Get('search')
  search(@Query('q') query: string) {
    return this.igdbService.search(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.igdbService.findById(parseInt(id));
  }
}
