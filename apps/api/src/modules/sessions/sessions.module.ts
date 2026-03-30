import { Module } from '@nestjs/common';

import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import {AuthModule} from '../auth/auth.module';
import {UsersModule} from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
