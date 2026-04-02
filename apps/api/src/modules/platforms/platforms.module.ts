import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { IgdbModule } from '../igdb/igdb.module';
import { UsersModule } from '../users/users.module';
import { SteamSyncProcessor } from './steam/steam-sync.processor';
import { SteamController } from './steam/steam.controller';
import { SteamService } from './steam/steam.service';

@Module({
  imports: [AuthModule, UsersModule, BullModule.registerQueue({ name: 'steam-sync' }), GamesModule, IgdbModule],
  controllers: [SteamController],
  providers: [SteamService, SteamSyncProcessor],
})
export class PlatformsModule {}
