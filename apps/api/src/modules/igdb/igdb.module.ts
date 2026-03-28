import { Module } from '@nestjs/common';

import { IgdbController } from './igdb.controller';
import { IgdbService } from './igdb.service';

@Module({
  controllers: [IgdbController],
  providers: [IgdbService],
  exports: [IgdbService],
})
export class IgdbModule {}
