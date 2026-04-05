import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { IgdbModule } from '../igdb/igdb.module';
import { UsersModule } from '../users/users.module';
import { PsnSyncProcessor } from './psn/psn-sync.processor';
import { PsnController } from './psn/psn.controller';
import { PsnService } from './psn/psn.service';
import { RetroAchievementsSyncProcessor } from './retroachievements/retroachievements-sync.processor';
import { RetroAchievementsController } from './retroachievements/retroachievements.controller';
import { RetroAchievementsService } from './retroachievements/retroachievements.service';
import { SteamSyncProcessor } from './steam/steam-sync.processor';
import { SteamController } from './steam/steam.controller';
import { SteamService } from './steam/steam.service';
import { XboxSyncProcessor } from './xbox/xbox-sync.processor';
import { XboxController } from './xbox/xbox.controller';
import { XboxService } from './xbox/xbox.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GamesModule,
    IgdbModule,
    BullModule.registerQueue({ name: 'steam-sync' }),
    BullModule.registerQueue({ name: 'psn-sync' }),
    BullModule.registerQueue({ name: 'xbox-sync' }),
    BullModule.registerQueue({ name: 'retroachievements-sync' }),
  ],
  controllers: [SteamController, PsnController, XboxController, RetroAchievementsController],
  providers: [
    SteamService,
    SteamSyncProcessor,
    PsnService,
    PsnSyncProcessor,
    XboxService,
    XboxSyncProcessor,
    RetroAchievementsService,
    RetroAchievementsSyncProcessor,
  ],
})
export class PlatformsModule {}
