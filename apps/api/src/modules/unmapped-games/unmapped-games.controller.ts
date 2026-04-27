import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { MapUnmappedGameSchema, MapUnmappedGameSchemaDto, User } from '@grimoire/shared';

import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UnmappedGamesService } from './unmapped-games.service';

@Controller('unmapped-games')
export class UnmappedGamesController {
  constructor(private unmappedGamesService: UnmappedGamesService) {}

  @Get()
  getUnmappedGamesForUser(@CurrentUser() user: RequestUser, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.unmappedGamesService.getUnmappedGamesForUser(user.id, limit, offset);
  }

  @Post('/map/:id')
  mapGameForUser(
    @CurrentUser() user: RequestUser,
    @Param('id') unmappedGameID: string,
    @Body(new ZodValidationPipe(MapUnmappedGameSchema)) body: MapUnmappedGameSchemaDto,
  ) {
    return this.unmappedGamesService.mapGameForUser(user.id, unmappedGameID, body);
  }
}
