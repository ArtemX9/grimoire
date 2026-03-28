# Grimoire — Architectural Guidelines

## Project Overview

Personal game backlog manager with platform sync (Steam), IGDB metadata, and AI-powered mood-based recommendations. Built as an open-source, self-hostable project with a future-ready cloud tier.

**Repo:** monorepo (pnpm workspaces)  
**License:** MIT  
**Status:** Active development

---

## Tech Stack

### Backend
| Concern | Choice | Reason |
|---|---|---|
| Framework | NestJS + TypeScript | Modular, decorator-based, production-grade |
| Database | PostgreSQL | Relational, fits data model, Prisma support |
| ORM | Prisma | Schema-first, generated types, clean migrations |
| Auth | Better Auth | Open source, self-hostable, NestJS compatible |
| Queue | BullMQ | Redis-backed, NestJS module available |
| Scheduler | @nestjs/schedule | Cron jobs for periodic platform sync |
| Streaming | SSE (@Sse decorator) | LLM token streaming, sync progress |
| Validation | Zod (shared) + class-validator | Shared schemas, NestJS pipes |

### Frontend
| Concern | Choice | Reason |
|---|---|---|
| Framework | React 18 + TypeScript + Vite | Fast DX, no SSR needed (auth-gated app) |
| State (server) | RTK Query | Pairs with Redux, handles caching/invalidation |
| State (client) | Redux Toolkit | Predictable, pure reducers, DevTools |
| UI Components | Shadcn/ui | Owned code, Radix primitives, Tailwind-based |
| Styling | Tailwind CSS | Required by Shadcn, utility-first |
| SSE client | Native EventSource | LLM streaming, sync progress updates |

### Infrastructure
| Concern | Choice |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse proxy | Nginx |
| SSL | Certbot + Cloudflare DNS challenge |
| Dynamic DNS | Cloudflare (home NAS) or static IP (cloud) |
| CI/CD | GitHub Actions |
| Registry | GitHub Container Registry (ghcr.io) |

### Integrations
| Service | Method | Notes |
|---|---|---|
| Steam | Steam Web API (public) | OAuth login + library sync |
| IGDB | Twitch OAuth app + IGDB API | Metadata, covers, genres |
| Grok (xAI) | OpenAI-compatible API | Default LLM provider |
| Claude / OpenAI | Same adapter interface | Fallback providers |

---

## Monorepo Structure

```
grimoire/
├── apps/
│   ├── api/                          # NestJS backend
│   └── web/                          # React frontend
├── packages/
│   └── shared/                       # Shared across apps
│       ├── types/                    # TypeScript interfaces
│       ├── schemas/                  # Zod validation schemas
│       └── constants/                # Enums, genre tags, platform ids
├── docker-compose.yml                # Local development
├── docker-compose.prod.yml           # Production
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, typecheck, test
│       └── deploy.yml                # Build + push to ghcr.io
├── package.json                      # Workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### apps/api/
```
api/
├── src/
│   ├── modules/
│   │   ├── auth/                     # Better Auth integration
│   │   ├── users/                    # User profile, plan management
│   │   ├── games/                    # Core game CRUD, status management
│   │   ├── sessions/                 # Play session logging
│   │   ├── platforms/
│   │   │   └── steam/                # Steam OAuth + library sync
│   │   ├── igdb/                     # IGDB search + metadata fetch
│   │   └── ai/                       # LLM adapter, recommendation logic
│   ├── common/
│   │   ├── decorators/               # @CurrentUser, @Plan, etc.
│   │   ├── guards/                   # AuthGuard, PlanGuard
│   │   ├── filters/                  # Global exception filter
│   │   ├── interceptors/             # Logging, transform response
│   │   └── pipes/                    # ZodValidationPipe
│   ├── config/                       # @nestjs/config typed config
│   ├── prisma/                       # PrismaService
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── Dockerfile
├── .env.example
└── tsconfig.json
```

### apps/web/
```
web/
├── src/
│   ├── app/
│   │   ├── store.ts                  # RTK store setup
│   │   ├── api.ts                    # RTK Query base API
│   │   └── providers.tsx             # Redux Provider, etc.
│   ├── features/                     # Feature-sliced, mirrors backend modules
│   │   ├── games/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── gamesApi.ts           # RTK Query endpoints
│   │   │   └── gamesSlice.ts
│   │   ├── sessions/
│   │   ├── ai/
│   │   │   ├── components/
│   │   │   │   └── AiPanel.tsx
│   │   │   ├── aiSlice.ts            # mood, sessionLength, streamedTokens
│   │   │   └── useAiStream.ts        # SSE EventSource hook
│   │   └── platforms/
│   │       └── steam/
│   ├── shared/
│   │   ├── components/               # Shadcn + custom base components
│   │   ├── hooks/                    # useDebounce, useLocalStorage, etc.
│   │   └── utils/
│   ├── pages/
│   │   ├── LibraryPage.tsx
│   │   ├── GameDetailPage.tsx
│   │   └── SettingsPage.tsx
│   └── main.tsx
├── Dockerfile
├── nginx.conf                        # Serve built assets + proxy /api
└── tsconfig.json
```

### packages/shared/
```
shared/
├── types/
│   ├── game.ts                       # Game, GameStatus, UserGame
│   ├── session.ts                    # PlaySession, SessionLog
│   ├── platform.ts                   # Platform enum, SteamGame
│   ├── ai.ts                         # MoodTag, RecommendationRequest
│   └── user.ts                       # User, Plan
├── schemas/
│   ├── game.schema.ts                # Zod: CreateGameSchema, etc.
│   └── session.schema.ts
└── constants/
    ├── genres.ts                     # Genre tag list
    ├── moods.ts                      # Mood tag list
    └── platforms.ts                  # Platform enum values
```

---

## Data Model (Prisma)

```prisma
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  plan          Plan          @default(FREE)
  stripeId      String?
  createdAt     DateTime      @default(now())
  games         UserGame[]
  sessions      PlaySession[]
  platforms     UserPlatform[]
}

enum Plan {
  FREE
  PRO
  LIFETIME
}

model UserGame {
  id            String      @id @default(cuid())
  userId        String
  igdbId        Int
  steamAppId    Int?
  title         String
  coverUrl      String?
  genres        String[]
  status        GameStatus  @default(BACKLOG)
  playtimeHours Float       @default(0)
  userRating    Int?
  notes         String?
  moods         String[]
  addedAt       DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  user          User        @relation(fields: [userId], references: [id])
  sessions      PlaySession[]

  @@unique([userId, igdbId])
}

enum GameStatus {
  BACKLOG
  PLAYING
  COMPLETED
  DROPPED
  WISHLIST
}

model PlaySession {
  id         String    @id @default(cuid())
  userId     String
  gameId     String
  startedAt  DateTime
  endedAt    DateTime?
  durationMin Int?
  mood       String[]
  notes      String?
  user       User      @relation(fields: [userId], references: [id])
  game       UserGame  @relation(fields: [gameId], references: [id])
}

model UserPlatform {
  id           String    @id @default(cuid())
  userId       String
  platform     Platform
  externalId   String
  accessToken  String?
  refreshToken String?
  lastSyncAt   DateTime?
  user         User      @relation(fields: [userId], references: [id])

  @@unique([userId, platform])
}

enum Platform {
  STEAM
  PSN
  XBOX
  EPIC
  MANUAL
}
```

---

## Key Architectural Decisions

### Multi-tenancy from day one
Every data model has `userId`. No exceptions. This makes monetization and multi-user support a configuration change, not a migration nightmare.

### Plan-based feature gates
Never hardcode plan checks inline. Use a central config + guard:

```ts
const PLAN_FEATURES = {
  FREE:     { platformSyncs: 1, aiRecommendations: false, maxGames: 50 },
  PRO:      { platformSyncs: 4, aiRecommendations: true,  maxGames: Infinity },
  LIFETIME: { platformSyncs: 4, aiRecommendations: true,  maxGames: Infinity },
}
```

Apply via `@Plan(PlanFeature.AI_RECOMMENDATIONS)` decorator + `PlanGuard`.

### LLM provider adapter
Never call Grok/Claude directly from business logic. Route through an adapter:

```ts
interface LLMProvider {
  recommend(context: RecommendationContext): Observable<string>
}

@Injectable()
class GrokProvider implements LLMProvider { ... }

@Injectable()
class ClaudeProvider implements LLMProvider { ... }
```

`AIService` takes `LLMProvider` via injection. Swap providers via config, not code changes.

### SSE for LLM streaming
All AI recommendation responses stream token-by-token via SSE. Never wait for a full LLM response before responding to the client.

```ts
@Sse('recommend/stream')
@UseGuards(AuthGuard, PlanGuard)
streamRecommendation(@Query() dto: MoodQueryDto): Observable<MessageEvent> {
  return this.aiService.streamRecommendation(dto)
}
```

### Shared Zod schemas
Validation schemas live in `packages/shared/schemas`. Backend uses them via `ZodValidationPipe`. Frontend uses the same schemas for form validation. Single source of truth, no drift.

### Feature-sliced frontend
`features/` directory mirrors backend modules. Working on the AI panel means touching `features/ai/` on frontend and `modules/ai/` on backend. Consistent mental map, no hunting across directories.

---

## Hosting Strategy

### Personal use (NAS)
- UGREEN DXP4800+ running UGOS Pro (Debian-based)
- Docker Compose: `api`, `web`, `postgres`, `redis` containers
- Nginx reverse proxy with SSL via Certbot + Cloudflare DNS challenge
- Cloudflare for dynamic DNS (home IP changes)
- `docker-compose.yml` for local dev, `docker-compose.prod.yml` for NAS

### Portfolio / public demo
- Railway or Hetzner CX22 (€4.5/mo)
- Same Docker Compose, different `.env`
- GitHub Actions deploys on push to `main`

### Future cloud tier
- Move to managed PostgreSQL (Supabase or Neon)
- Add Stripe for plan management
- Redis for LLM response caching (same mood+backlog fingerprint = cached response)

---

## API Design Conventions

- REST for CRUD operations
- SSE for streaming (LLM, sync progress)
- All responses wrapped: `{ data, meta?, error? }`
- Versioning via URL prefix: `/api/v1/`
- Auth via Bearer token (Better Auth)

---

## Git Conventions

- **Branches:** `feature/`, `fix/`, `chore/`, `docs/`
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`)
- **PRs:** Even solo — keeps history clean and reviewable
- **Main branch:** always deployable

---

## Environment Variables

```bash
# api/.env.example
DATABASE_URL=postgresql://user:pass@localhost:5432/grimoire
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=
STEAM_API_KEY=
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
GROK_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
LLM_PROVIDER=grok   # grok | claude | openai
```

---

## Out of Scope (for now)

- Epic Games, Xbox, PSN sync — no reliable public APIs
- Mobile app — web is responsive enough
- Social features — not the goal
- SSR / Next.js — app is auth-gated, SEO irrelevant
