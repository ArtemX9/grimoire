import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  encryptionKey: process.env.ENCRYPTION_KEY,
  steam: { apiKey: process.env.STEAM_API_KEY },
  playstation: { npsso: process.env.PSN_NPSSO },
  xbox: {
    clientID: process.env.XBOX_CLIENT_ID,
    clientSecret: process.env.XBOX_CLIENT_SECRET,
    redirectURI: process.env.XBOX_REDIRECT_URI,
    frontendRedirectURI: process.env.XBOX_FRONTEND_REDIRECT_URI,
  },
  igdb: {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
  },
  llm: {
    provider: process.env.LLM_PROVIDER ?? 'grok',
    grokApiKey: process.env.GROK_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL ?? 'llama3.2',
    temperature: parseFloat(process.env.LLM_TEMPERATURE ?? '0.7'),
    numCtx: parseInt(process.env.LLM_NUM_CTX ?? '32768', 10),
  },
  auth: {
    secret: process.env.BETTER_AUTH_SECRET,
    url: process.env.BETTER_AUTH_URL,
  },
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' },
}));
