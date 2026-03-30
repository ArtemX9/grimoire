import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { GamesModule } from '../games/games.module';
import { IgdbModule } from '../igdb/igdb.module';
import { SteamSyncProcessor } from './steam/steam-sync.processor';
import { SteamController } from './steam/steam.controller';
import { SteamService } from './steam/steam.service';
import {AuthModule} from '../auth/auth.module';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: 'steam-sync' }), GamesModule, IgdbModule],
  controllers: [SteamController],
  providers: [SteamService, SteamSyncProcessor],
})
export class PlatformsModule {}
