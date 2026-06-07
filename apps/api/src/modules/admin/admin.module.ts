import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { PlatformsModule } from '../platforms/platforms.module';
import { UsersModule } from '../users/users.module';
import { AdminAiService } from './admin-ai.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, UsersModule, PlatformsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAiService],
})
export class AdminModule {}
