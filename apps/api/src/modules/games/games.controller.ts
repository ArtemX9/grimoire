import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CreateGameSchema, GameStatus, Genre, Platform, RemapGameSchema, SortableField, UpdateGameSchema, User } from '@grimoire/shared';

import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: GameStatus,
    @Query('search') search?: string,
    @Query('genre') genre?: Genre,
    @Query('platform') platform?: Platform,
    @Query('sortBy') sortBy?: SortableField,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.gamesService.findAll(user.id, status, search, genre, platform, sortBy, order);
  }

  @Get('stats')
  getGameStats(@CurrentUser() user: RequestUser) {
    return this.gamesService.getStats(user.id);
  }

  @Get(':id')
  findGame(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.gamesService.findOne(user.id, id);
  }

  @Post()
  createGame(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateGameSchema)) body: any) {
    return this.gamesService.addManually(user.id, body);
  }

  @Patch(':id')
  updateGameUserData(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateGameSchema)) body: any) {
    return this.gamesService.update(user.id, id, body);
  }

  @Patch(':id/remap')
  remapGame(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(RemapGameSchema)) body: any) {
    return this.gamesService.remap(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.gamesService.remove(user.id, id);
  }
}
