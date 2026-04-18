import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GamesService } from '../games/games.service';
import { UsersModule } from '../users/users.module';
import { UnmappedGamesController } from './unmapped-games.controller';
import { UnmappedGamesService } from './unmapped-games.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [UnmappedGamesController],
  providers: [UnmappedGamesService, GamesService],
})
export class UnmappedGamesModule {}
