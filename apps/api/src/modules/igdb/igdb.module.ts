import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { IgdbController } from './igdb.controller';
import { IgdbService } from './igdb.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [IgdbController],
  providers: [IgdbService],
  exports: [IgdbService],
})
export class IgdbModule {}
