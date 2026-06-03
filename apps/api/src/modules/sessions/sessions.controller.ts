import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CreateSessionDto, CreateSessionSchema } from '@grimoire/shared';

import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get('recent')
  findRecent(@CurrentUser() user: RequestUser, @Query('limit') limit?: string) {
    return this.sessionsService.findRecent(user.id, limit ? parseInt(limit) : 10);
  }

  @Get('game/:gameId')
  findByGame(@CurrentUser() user: RequestUser, @Param('gameId') gameId: string) {
    return this.sessionsService.findByGame(user.id, gameId);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateSessionSchema)) body: CreateSessionDto) {
    return this.sessionsService.create(user.id, body);
  }
}
