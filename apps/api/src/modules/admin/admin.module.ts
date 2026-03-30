import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AdminAiService } from './admin-ai.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import {AuthModule} from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAiService],
})
export class AdminModule {}
