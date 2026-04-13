import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CreateGameSchema, GameStatus, Genre, RemapGameSchema, UpdateGameSchema } from '@grimoire/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query('status') status?: GameStatus, @Query('search') search?: string, @Query('genre') genre?: Genre) {
    return this.gamesService.findAll(user.id, status, search, genre);
  }

  @Get('stats')
  getGameStats(@CurrentUser() user: any) {
    return this.gamesService.getStats(user.id);
  }

  @Get(':id')
  findGame(@CurrentUser() user: any, @Param('id') id: string) {
    return this.gamesService.findOne(user.id, id);
  }

  @Post()
  createGame(@CurrentUser() user: any, @Body(new ZodValidationPipe(CreateGameSchema)) body: any) {
    return this.gamesService.create(user.id, body);
  }

  @Patch(':id')
  updateGameUserData(@CurrentUser() user: any, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateGameSchema)) body: any) {
    return this.gamesService.update(user.id, id, body);
  }

  @Patch(':id/remap')
  remapGame(@CurrentUser() user: any, @Param('id') id: string, @Body(new ZodValidationPipe(RemapGameSchema)) body: any) {
    return this.gamesService.remap(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.gamesService.remove(user.id, id);
  }
}
