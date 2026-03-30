import { Module } from '@nestjs/common';

import { IgdbController } from './igdb.controller';
import { IgdbService } from './igdb.service';
import {AuthModule} from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [IgdbController],
  providers: [IgdbService],
  exports: [IgdbService],
})
export class IgdbModule {}
