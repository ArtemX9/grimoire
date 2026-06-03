import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { MapUnmappedGameSchema, MapUnmappedGameSchemaDto } from '@grimoire/shared';

import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UnmappedGamesService } from './unmapped-games.service';

@Controller('unmapped-games')
export class UnmappedGamesController {
  constructor(private unmappedGamesService: UnmappedGamesService) {}

  @Get()
  getUnmappedGamesForUser(@CurrentUser() user: RequestUser, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.unmappedGamesService.getUnmappedGamesForUser(
      user.id,
      limit !== undefined ? parseInt(limit, 10) : undefined,
      offset !== undefined ? parseInt(offset, 10) : undefined,
    );
  }

  @Post('/map/:id')
  mapGameForUser(
    @CurrentUser() user: RequestUser,
    @Param('id') unmappedGameID: string,
    @Body(new ZodValidationPipe(MapUnmappedGameSchema)) body: MapUnmappedGameSchemaDto,
  ) {
    return this.unmappedGamesService.mapGameForUser(user.id, unmappedGameID, body);
  }

  @Delete(':id')
  deleteGame(@CurrentUser() user: RequestUser, @Param('id') unmappedGameID: string) {
    return this.unmappedGamesService.deleteGame(user.id, unmappedGameID);
  }
}
