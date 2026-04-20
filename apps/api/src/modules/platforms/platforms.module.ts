import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { IgdbModule } from '../igdb/igdb.module';
import { UsersModule } from '../users/users.module';
import { PLAYSTATION_QUEUE_TITLE } from './playstation/constants';
import { PlaystationAuthService } from './playstation/playstation-auth.service';
import { PlaystationSyncProcessor } from './playstation/playstation-sync.processor';
import { PlaystationController } from './playstation/playstation.controller';
import { PlaystationService } from './playstation/playstation.service';
import { STEAM_QUEUE_TITLE } from './steam/constants';
import { SteamSyncProcessor } from './steam/steam-sync.processor';
import { SteamController } from './steam/steam.controller';
import { SteamService } from './steam/steam.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    BullModule.registerQueue({ name: STEAM_QUEUE_TITLE }),
    BullModule.registerQueue({ name: PLAYSTATION_QUEUE_TITLE }),
    GamesModule,
    IgdbModule,
  ],
  controllers: [SteamController, PlaystationController],
  providers: [SteamService, SteamSyncProcessor, PlaystationAuthService, PlaystationService, PlaystationSyncProcessor],
})
export class PlatformsModule {}
