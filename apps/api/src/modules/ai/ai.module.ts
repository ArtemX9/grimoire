import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ClaudeProvider } from './providers/claude.provider';
import { GrokProvider } from './providers/grok.provider';
import { OllamaProvider } from './providers/ollama.provider';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, SessionsModule, GamesModule],
  controllers: [AiController],
  providers: [AiService, GrokProvider, ClaudeProvider, OllamaProvider],
})
export class AiModule {}
