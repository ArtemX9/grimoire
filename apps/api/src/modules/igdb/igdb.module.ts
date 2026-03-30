import { Module } from '@nestjs/common';

import { IgdbController } from './igdb.controller';
import { IgdbService } from './igdb.service';
import {AuthModule} from '../auth/auth.module';
import {UsersModule} from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [IgdbController],
  providers: [IgdbService],
  exports: [IgdbService],
})
export class IgdbModule {}
