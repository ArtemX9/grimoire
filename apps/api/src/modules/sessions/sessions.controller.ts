import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CreateSessionSchema } from '@grimoire/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get('recent')
  findRecent(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.sessionsService.findRecent(user.id, limit ? parseInt(limit) : 10);
  }

  @Get('game/:gameId')
  findByGame(@CurrentUser() user: any, @Param('gameId') gameId: string) {
    return this.sessionsService.findByGame(user.id, gameId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body(new ZodValidationPipe(CreateSessionSchema)) body: any) {
    return this.sessionsService.create(user.id, body);
  }
}
