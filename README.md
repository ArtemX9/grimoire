# Grimoire
![Steam](https://img.shields.io/badge/Steam-sync-1b2838?logo=steam&logoColor=white)
![PlayStation](https://img.shields.io/badge/PSN-sync-003791?logo=playstation&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-compatible-412991?logo=openai&logoColor=white)
![Grok](https://img.shields.io/badge/Grok-xAI-000000?logo=x&logoColor=white)

[![API health](https://img.shields.io/website?label=api&url=https%3A%2F%2Fgrimoire.arty-nas.work%2Fhealth)](https://grimoire.arty-nas.work/health)
[![Tests](https://github.com/ArtemX9/grimoire/actions/workflows/ci.yml/badge.svg)](https://github.com/ArtemX9/grimoire/actions/workflows/ci.yml)

[![Live demo](https://img.shields.io/badge/Live%20Demo-grimoire.arty--nas.work-blue?logo=googlechrome&logoColor=white)](https://grimoire.arty-nas.work)

Personal game backlog manager with Steam and PSN sync, IGDB metadata, and AI-powered mood-based recommendations.

**Self-hostable. Open source. MIT.**

> **Try it live →** [Open app](https://grimoire.arty-nas.work)  
> Demo account: `demo@grimoire.app` / `demo1234`  
> **Note:** AI features (mood-based picks) may respond slowly — the demo runs on a local Ollama instance on my home machine.

![Grimoire library](.github/assets/library-screenshot.png)

## Features

- Track games across statuses: backlog, playing, completed, dropped, wishlist
- Steam library sync (automatic, background job)
- IGDB metadata: covers, genres, ratings
- AI recommendations based on your mood, session length, and actual play history (not generic suggestions)
- LLM streaming via SSE — token-by-token responses
- Multi-provider LLM: Grok (default), Claude, OpenAI, or Ollama (local) — swap via config

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
git clone https://github.com/YOUR_USERNAME/grimoire
cd grimoire

# Install
pnpm install

# Copy env
cp apps/api/.env.example apps/api/.env
# Fill in STEAM_API_KEY, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, GROK_API_KEY

# Start infrastructure
docker compose up postgres redis -d

# Run migrations
pnpm db:migrate

# Generate prisma client
pnpm --filter api prisma generate

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

## Testing

### Unit tests

```bash
pnpm --filter api test
pnpm --filter web test:run
```

### E2E tests (Playwright)

E2E tests run against a separate `tests` database to avoid touching your dev data.

**One-time setup — create the test database:**

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE tests;"
```

**Each time before running E2E:**

```bash
# 1. Migrate and seed the test database
pnpm --filter api e2e:setup

# 2. Start the API pointed at the test database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tests pnpm --filter api dev

# 3. In a separate terminal — start the frontend
pnpm --filter web dev

# 4. In a third terminal — run the tests
pnpm --filter web e2e
```

Test credentials (created by the seed script):

| Role | Email | Password |
|---|---|---|
| User | `test@grimoire.test` | `password123` |
| User 2 | `test2@grimoire.test` | `password123` |
| Admin | `admin@grimoire.test` | `password123` |

To run against a built frontend (closer to production):

```bash
pnpm --filter web build
E2E_BASE_URL=http://localhost:4173 pnpm --filter web preview &
pnpm --filter web e2e
```

## Environment variables

See `apps/api/.env.example` for full reference.

Key vars:
- `LLM_PROVIDER` — `grok` | `claude` | `openai` | `ollama`
- `OLLAMA_BASE_URL` — Ollama server URL (default: `http://localhost:11434`)
- `OLLAMA_MODEL` — model name to use, e.g. `llama3.2`, `mistral` (default: `llama3.2`)
- `STEAM_API_KEY` — from [Steam Web API](https://steamcommunity.com/dev/apikey)
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` — from [Twitch Dev Console](https://dev.twitch.tv/console) for IGDB
- `PSN_NPSSO` — 64-character token for PlayStation Network sync. To obtain: log in to [account.sonyentertainment.com](https://account.sonyentertainment.com), then visit `https://ca.account.sony.com/api/v1/ssocookie` — the `npsso` field in the response is your token. Tokens expire; regenerate by repeating this step.

## Architecture

### Auth and admin flow

Grimoire uses a closed registration model — there is no public sign-up endpoint.

**Liveness probe**
`GET /health` returns `{ status: 'ok' }` — unauthenticated, excluded from the `/api/v1` prefix. Suitable for Docker healthchecks, load balancers, or uptime monitors.

**First-time setup**
`POST /api/v1/admin/setup` is the only unauthenticated write endpoint. It creates the first admin account and is rejected with `400 Bad Request` once any user exists.

**Account creation**
Only an admin can create accounts via `POST /api/v1/admin/users`. Newly created accounts have `mustChangePassword: true`. Every request from such an account (except `PATCH /api/v1/users/me/password`) is blocked by the global `MustChangePasswordGuard` with a `403 MUST_CHANGE_PASSWORD` response until the user sets a new password.

**Admin dashboard**
Admin-only endpoints are guarded by `AdminGuard` (requires `role: ADMIN`) composed via the `@AdminOnly()` decorator, which also enforces `AuthGuard`. The dashboard exposes:
- `GET /api/v1/admin/users` — paginated user list
- `DELETE /api/v1/admin/users/:id` — remove a user (self-deletion is rejected)
- `GET /api/v1/admin/stats` — per-user game/session/AI usage counts
- `GET|PATCH /api/v1/admin/settings/ai` — global AI toggle and per-user overrides
- `PATCH /api/v1/admin/users/:id/ai` — per-user AI enabled flag and request limit

**Per-user AI request limits**
Each user has `aiRequestsUsed` and `aiRequestsLimit` (nullable — no limit when `null`) fields. Before every AI recommendation, `AiService` checks:
1. Global AI enabled flag (`AiGlobalSettings` table).
2. Per-user `aiEnabled` flag.
3. `aiRequestsUsed >= aiRequestsLimit` (when limit is set).

If any check fails the request is rejected with `403 Forbidden` before the LLM call is made. On success, `aiRequestsUsed` is incremented.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed decisions.

## License

MIT
