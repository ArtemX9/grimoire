import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { GamesModule } from '../games/games.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ClaudeProvider } from './providers/claude.provider';
import { GrokProvider } from './providers/grok.provider';

@Module({
  imports: [PrismaModule, SessionsModule, GamesModule],
  controllers: [AiController],
  providers: [AiService, GrokProvider, ClaudeProvider],
})
export class AiModule {}
