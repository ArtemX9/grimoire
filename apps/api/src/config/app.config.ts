import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  steam: { apiKey: process.env.STEAM_API_KEY },
  igdb: {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
  },
  llm: {
    provider: process.env.LLM_PROVIDER ?? 'grok',
    grokApiKey: process.env.GROK_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
  auth: { secret: process.env.BETTER_AUTH_SECRET },
}));
