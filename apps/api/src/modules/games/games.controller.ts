import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CreateGameSchema, GameStatus, UpdateGameSchema } from '@grimoire/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query('status') status?: GameStatus) {
    return this.gamesService.findAll(user.id, status);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.gamesService.getStats(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.gamesService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body(new ZodValidationPipe(CreateGameSchema)) body: any) {
    return this.gamesService.create(user.id, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateGameSchema)) body: any) {
    return this.gamesService.update(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.gamesService.remove(user.id, id);
  }
}
