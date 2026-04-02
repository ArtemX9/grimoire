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
│   ├── api/                          # All RTK Query API slices (flat)
│   │   ├── api.ts                    # RTK Query base API (createApi, baseQuery)
│   │   ├── adminApi.ts
│   │   ├── authApi.ts
│   │   ├── gamesApi.ts
│   │   ├── igdbApi.ts
│   │   ├── sessionsApi.ts
│   │   ├── steamApi.ts
│   │   └── usersApi.ts
│   ├── store/                        # Redux store and client-side slices
│   │   ├── store.ts                  # Store setup
│   │   ├── hooks.ts                  # useAppDispatch, useAppSelector
│   │   ├── aiSlice.ts                # mood, sessionLength, streamedTokens
│   │   ├── filtersSlice.ts
│   │   └── uiSlice.ts
│   ├── components/                   # Shared/reusable components
│   │   ├── ui/                       # Shadcn primitives
│   │   ├── AiPanel/
│   │   │   ├── AiPanel.tsx
│   │   │   └── AiPanelContainer.tsx
│   │   ├── Layout/
│   │   │   ├── Layout.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ProtectedRoute/
│   │       ├── AdminRoute.tsx
│   │       ├── MustChangePasswordRoute.tsx
│   │       └── ProtectedRoute.tsx
│   ├── hooks/                        # Shared custom hooks
│   │   ├── useAiStream.ts            # SSE EventSource hook
│   │   └── useDebounce.ts
│   ├── utils/
│   │   └── cn.ts
│   ├── pages/                        # Route-level pages; each owns its sub-components
│   │   ├── AdminDashboardPage/
│   │   │   └── components/
│   │   ├── GameDetailPage/
│   │   │   └── components/
│   │   ├── LibraryPage/
│   │   │   └── components/           # GameCard, GameGrid, FilterBar, AddGameDialog
│   │   ├── LoginPage/
│   │   ├── SettingsPage/
│   │   ├── AdminSetupPage/
│   │   └── ChangePasswordPage/
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

### Frontend directory organisation
The frontend uses a role-based layout rather than feature-sliced directories:
- `api/` — all RTK Query endpoint slices in one place, named after their backend module (`gamesApi.ts`, `sessionsApi.ts`, etc.)
- `store/` — Redux store setup and all client-side slices (`aiSlice.ts`, `filtersSlice.ts`, `uiSlice.ts`)
- `components/` — shared, cross-page components and all Shadcn primitives
- `pages/` — one folder per route; page-specific components live in a `components/` subfolder co-located with the page

Working on the AI panel means touching `components/AiPanel/` (UI) + `store/aiSlice.ts` (client state) + `api/` (any server queries) on the frontend, and `modules/ai/` on the backend.

### Routing convention

All route strings are defined in `src/constants/routes.ts` and nowhere else.

```ts
// src/constants/routes.ts
export const ROUTES = {
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_SETUP:     '/admin/setup',
  CHANGE_PASSWORD: '/change-password',
  DEFAULT:         '/',
  GAME_DETAILS:    '/games/:id',
  LIBRARY:         '/library',
  LOGIN:           '/login',
  USER_SETTINGS:   '/settings',
}

// One exported helper per parameterised route
export const getGameDetailsURL = (gameID: string) => ROUTES.GAME_DETAILS.replace(':id', gameID);
```

Rules:
- Every new route gets a key in `ROUTES` before it is used anywhere
- `<Route path=...>`, `<Navigate to=...>`, `<Link to=...>`, `navigate(...)`, and `location.pathname` comparisons all import and use `ROUTES.XXX`
- Building a parameterised URL (e.g. `/games/42`) always goes through a dedicated helper exported from `routes.ts` — never via inline template literals
- `<Route path={ROUTES.GAME_DETAILS}>` is correct — the `:id` pattern stays as-is for React Router; only the *navigation* call needs the helper

### RTK Query API slice conventions

Every file in `src/api/` follows the same structure. `adminApi.ts` is the canonical reference.

**File layout (top to bottom):**
1. Shared package imports (`@grimoire/shared`)
2. Base API import — always relative (`./api`), never the `@/` alias
3. All type definitions, each prefixed with `export type`
4. `BASE_URL_PATH` constant — untyped `const` string, placed immediately before `injectEndpoints`
5. Named API slice — `export const xxxApi = api.injectEndpoints({ ... })`
6. Hook exports — destructured from the named slice

API files are plain `.ts`, never `.tsx`. No React import.

**Type naming:**

| Pattern | Example | When to use |
|---|---|---|
| `XxxRow` | `AdminUserRow` | Single item in a list response |
| `XxxListResponse` | `AdminUserListResponse` | Paginated/list wrapper `{ data, total }` |
| `CreateXxxArgs` | `CreateUserArgs` | POST mutation input |
| `UpdateXxxArgs` | `UpdateUserAiArgs` | PATCH/PUT mutation input |
| `SetupXxxArgs` | `SetupAdminArgs` | One-time or special-case mutation input |
| Plain noun | `AiGlobalSettings`, `AdminStats` | Config shapes and complex response objects |

**Query vs mutation structure:**

Queries use the string shorthand when there is no request body:
```ts
listAdminUsers: builder.query<AdminUserListResponse, void>({
  query: () => `${BASE_URL_PATH}/users`,
  providesTags: ['AdminUser'],
}),
```

Mutations always use the object form. When the args include an `id` that belongs in the URL, destructure it inline:
```ts
updateUserAiSettings: builder.mutation<void, UpdateUserAiArgs>({
  query: ({ id, ...body }) => ({ url: `${BASE_URL_PATH}/users/${id}/ai`, method: 'PATCH', body }),
  invalidatesTags: ['AdminUser'],
}),
```

When only specific fields go to the body, pick them explicitly rather than spreading:
```ts
updateUserPlan: builder.mutation<AdminUserRow, UpdateUserPlanArgs>({
  query: ({ id, plan }) => ({ url: `${BASE_URL_PATH}/users/${id}/plan`, method: 'PATCH', body: { plan } }),
  invalidatesTags: ['AdminUser'],
}),
```

**Cache tags:**

`providesTags` and `invalidatesTags` take an array of string literals. Factory functions are only used when per-item cache granularity is genuinely needed. Cross-tag invalidation is allowed when a mutation affects multiple caches:
```ts
// Global AI toggle affects both admin and user caches
invalidatesTags: ['AdminUser', 'User'],
```

Omit tags entirely on one-time setup endpoints where there is no cache to invalidate.

Known tag types: `'Game' | 'Session' | 'User' | 'AdminUser' | 'Stats'`

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
