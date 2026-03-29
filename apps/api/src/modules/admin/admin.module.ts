import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AdminAiService } from './admin-ai.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAiService],
})
export class AdminModule {}
