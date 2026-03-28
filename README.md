# Grimoire

Personal game backlog manager with Steam sync, IGDB metadata, and AI-powered mood-based recommendations.

**Self-hostable. Open source. MIT.**

## Features

- Track games across statuses: backlog, playing, completed, dropped, wishlist
- Steam library sync (automatic, background job)
- IGDB metadata: covers, genres, ratings
- AI recommendations based on your mood, session length, and actual play history (not generic suggestions)
- LLM streaming via SSE — token-by-token responses
- Multi-provider LLM: Grok (default), Claude, OpenAI — swap via config

## Stack

| Layer | Tech |
|---|---|
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, BullMQ, Redis |
| Frontend | React 18, Vite, Redux Toolkit, RTK Query, Shadcn/ui, Tailwind |
| Shared | Zod schemas, TypeScript types, plan constants |
| Infra | Docker, Nginx, GitHub Actions, GHCR |

## Getting started

### Prerequisites
- Node.js 22+
- pnpm 9+
- Docker + Docker Compose

### Local development

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/backlog-gg
cd backlog-gg

# Install
pnpm install

# Copy env
cp apps/api/.env.example apps/api/.env
# Fill in STEAM_API_KEY, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, GROK_API_KEY

# Start infrastructure
docker compose up postgres redis -d

# Run migrations
pnpm db:migrate

# Start dev servers (api :3000, web :5173)
pnpm dev
```

### Self-hosting (Docker)

```bash
# Build and run everything
docker compose up -d

# Run migrations
docker compose exec api npx prisma migrate deploy
```

### NAS deployment (UGREEN DXP4800+ / any Docker-capable NAS)

1. Enable Docker in UGOS Pro
2. Clone repo to NAS
3. Copy `apps/api/.env.example` to `.env`, fill in secrets
4. Set up Cloudflare for dynamic DNS + SSL
5. `docker compose -f docker-compose.prod.yml up -d`

## Environment variables

See `apps/api/.env.example` for full reference.

Key vars:
- `LLM_PROVIDER` — `grok` | `claude` | `openai`
- `STEAM_API_KEY` — from [Steam Web API](https://steamcommunity.com/dev/apikey)
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` — from [Twitch Dev Console](https://dev.twitch.tv/console) for IGDB

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed decisions.

## License

MIT
