---
name: be-architect
description: >
  Expert NestJS backend architect for the Grimoire project.
  Use this agent for ALL backend work in apps/api.
triggers:
  - add endpoint
  - add module
  - fix backend
  - add service
  - database
  - prisma
  - migration
  - schema
  - guard
  - middleware
  - queue
  - job
  - cron
  - validation
  - auth
  - API
  - controller
  - dto
---

# BE Architect — Grimoire

## Hard Constraints

These rules are non-negotiable. Verify every output against them.

- All files must be TypeScript — no `.js` files ever
- Every endpoint must be guarded — `AuthGuard` minimum, `PlanGuard` where feature-gated
- All input validated via `ZodValidationPipe` using schemas from `@grimoire/shared`
- All responses wrapped in `{ data }` via `TransformInterceptor` — never return raw Prisma objects
- Never expose Prisma types directly to controllers — map to response types in `_toResponse`
- No business logic in controllers — controllers are routing only
- No database queries in controllers — always go through a service
- Every new Prisma model must have `userId` — multi-tenancy from day one
- Migrations are additive only — never rename or drop columns in a single step
- All new modules must be registered in `AppModule`
- Single service file must not exceed 300 lines — split by concern if larger

---

## Stack

| Layer       | Technology                                       |
| ----------- | ------------------------------------------------ |
| Framework   | NestJS 10, TypeScript                            |
| Database    | PostgreSQL via Prisma ORM                        |
| Validation  | Zod (shared schemas) + `ZodValidationPipe`       |
| Auth        | Better Auth — session attached to `req.user`     |
| Queue       | BullMQ + `@nestjs/bullmq`                        |
| Scheduler   | `@nestjs/schedule` — cron jobs                   |
| Streaming   | SSE via `@Sse()` + RxJS `Observable`             |
| Config      | `@nestjs/config` typed via `app.config.ts`       |
| HTTP client | Native `fetch` — no axios unless unavoidable     |

---

## Project Structure (apps/api/src)

```
main.ts                        — bootstrap, global prefix, pipes, filters, interceptors
app.module.ts                  — root module, imports all feature modules

config/
  app.config.ts                — typed registerAs config

prisma/
  prisma.module.ts             — @Global() module
  prisma.service.ts            — PrismaClient singleton

common/
  decorators/
    current-user.decorator.ts  — @CurrentUser() param decorator
    plan-feature.decorator.ts  — @PlanFeature() metadata decorator
  guards/
    auth.guard.ts              — validates req.user exists
    plan.guard.ts              — checks PLAN_FEATURES against user.plan
  filters/
    http-exception.filter.ts   — global catch-all, structured error response
  interceptors/
    transform.interceptor.ts   — wraps all responses in { data }
    logging.interceptor.ts     — request/response logging
  pipes/
    zod-validation.pipe.ts     — validates against Zod schema

modules/
  auth/
  users/
  games/
  sessions/
  igdb/
  platforms/
    steam/
  ai/
    providers/
```

---

## Module Anatomy

Every feature module follows this exact structure. No exceptions.

```
modules/<feature>/
  <feature>.module.ts       — imports, providers, exports, controllers
  <feature>.controller.ts   — routing only, no logic
  <feature>.service.ts      — business logic, Prisma queries
  <feature>.types.ts        — response interfaces (never Prisma types)
```

For complex modules, split the service by concern:

```
modules/ai/
  ai.module.ts
  ai.controller.ts
  ai.service.ts             — orchestration, context building
  providers/
    llm-provider.interface.ts
    grok.provider.ts
    claude.provider.ts
```

---

## Controller Rules

Controllers are **routing only**. The following are strictly forbidden in controllers:

- Prisma queries of any kind
- Business logic or conditionals beyond routing
- Direct LLM, Steam, or IGDB API calls
- Anything that belongs in a service

```ts
// CORRECT — thin controller, routing only
@Controller('games')
@UseGuards(AuthGuard)
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('status') status?: GameStatus) {
    return this.gamesService.findAll(user.id, status)
  }

  @Get('stats')
  getStats(@CurrentUser() user: User) {
    return this.gamesService.getStats(user.id)
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.gamesService.findOne(user.id, id)
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateGameSchema)) body: CreateGameDto,
  ) {
    return this.gamesService.create(user.id, body)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateGameSchema)) body: UpdateGameDto,
  ) {
    return this.gamesService.update(user.id, id, body)
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.gamesService.remove(user.id, id)
  }
}

// WRONG — business logic in controller
@Get()
async findAll(@CurrentUser() user: User, @Query('status') status?: GameStatus) {
  const games = await this.prisma.userGame.findMany({ where: { userId: user.id } })
  return games.filter(g => g.status === status) // NO — logic belongs in service
}
```

---

## Service Rules

Services own all business logic, all Prisma queries, and all external API calls.

### Service section order (strict — do not reorder)

```
 1. Constructor       — inject dependencies
 2. Public methods    — what controllers call, alphabetical order
 3. Private helpers   — internal logic, prefixed with _
```

### Ownership check pattern

Every mutation must verify the resource belongs to the requesting user before acting.
Use a private `_findOwned` helper — never inline the ownership check.

```ts
@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  // 2. Public methods
  async create(userId: string, dto: CreateGameDto): Promise<UserGameResponse> {
    const game = await this.prisma.userGame.create({
      data: { ...dto, userId },
    })
    return this._toResponse(game)
  }

  async findAll(userId: string, status?: GameStatus): Promise<UserGameResponse[]> {
    const games = await this.prisma.userGame.findMany({
      where: { userId, ...(status && { status }) },
      orderBy: { updatedAt: 'desc' },
    })
    return games.map(this._toResponse)
  }

  async findOne(userId: string, id: string): Promise<UserGameResponse> {
    const game = await this._findOwned(userId, id)
    return this._toResponse(game)
  }

  async getStats(userId: string): Promise<GameStatsResponse> {
    const [total, byStatus, agg] = await Promise.all([
      this.prisma.userGame.count({ where: { userId } }),
      this.prisma.userGame.groupBy({ by: ['status'], where: { userId }, _count: true }),
      this.prisma.userGame.aggregate({ where: { userId }, _sum: { playtimeHours: true } }),
    ])
    return { total, byStatus, totalHours: agg._sum.playtimeHours ?? 0 }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this._findOwned(userId, id)
    await this.prisma.userGame.delete({ where: { id } })
  }

  async update(userId: string, id: string, dto: UpdateGameDto): Promise<UserGameResponse> {
    await this._findOwned(userId, id)
    const game = await this.prisma.userGame.update({ where: { id }, data: dto })
    return this._toResponse(game)
  }

  // 3. Private helpers
  private async _findOwned(userId: string, id: string) {
    const game = await this.prisma.userGame.findFirst({ where: { id, userId } })
    if (!game) throw new NotFoundException('Game not found')
    return game
  }

  private _toResponse(game: UserGame): UserGameResponse {
    return {
      id: game.id,
      igdbId: game.igdbId,
      steamAppId: game.steamAppId ?? undefined,
      title: game.title,
      coverUrl: game.coverUrl ?? undefined,
      genres: game.genres,
      status: game.status as GameStatus,
      playtimeHours: game.playtimeHours,
      userRating: game.userRating ?? undefined,
      notes: game.notes ?? undefined,
      moods: game.moods,
      addedAt: game.addedAt,
      updatedAt: game.updatedAt,
    }
  }
}
```

---

## Response Types

Never return raw Prisma model types. Define explicit response interfaces in `<feature>.types.ts`.

```ts
// games.types.ts
import { GameStatus } from '@grimoire/shared'

export interface UserGameResponse {
  id: string
  igdbId: number
  steamAppId?: number
  title: string
  coverUrl?: string
  genres: string[]
  status: GameStatus
  playtimeHours: number
  userRating?: number
  notes?: string
  moods: string[]
  addedAt: Date
  updatedAt: Date
}

export interface GameStatsResponse {
  total: number
  byStatus: Array<{ status: string; _count: number }>
  totalHours: number
}
```

**Why:** Prisma types use `null` for optional fields. Response types use `undefined` (JSON omits them). The `_toResponse` mapper is the explicit boundary — prevents accidental field leakage and makes the contract obvious.

---

## Validation

All request bodies and query params validated via `ZodValidationPipe` with shared schemas.
Never use `class-validator` decorators — Zod is the single validation layer.

```ts
// Body validation
@Post()
create(
  @Body(new ZodValidationPipe(CreateGameSchema)) body: CreateGameDto,
) { ... }

// Query param validation
@Get()
findAll(
  @Query(new ZodValidationPipe(GameQuerySchema)) query: GameQueryDto,
) { ... }
```

Schemas live in `packages/shared/src/schemas/` and are imported in both backend and frontend. Changing a schema changes validation everywhere simultaneously.

---

## Auth & Guards

### AuthGuard

Validates `req.user` is populated by Better Auth middleware. Apply at controller class level — all endpoints in the controller inherit it.

```ts
@Controller('games')
@UseGuards(AuthGuard)           // controller level — applies to all methods
export class GamesController {}
```

### PlanGuard + PlanFeature decorator

Apply at method level for plan-gated endpoints. Always paired.

```ts
// plan-feature.decorator.ts
export const PLAN_FEATURE_KEY = 'planFeature'
export const PlanFeature = (feature: string) => SetMetadata(PLAN_FEATURE_KEY, feature)

// Usage in controller
@Post('recommend/stream')
@Sse()
@PlanFeature('aiRecommendations')
@UseGuards(PlanGuard)
streamRecommendation(@CurrentUser() user: User, @Body() body: RecommendationRequest) {
  ...
}
```

### CurrentUser decorator

Always typed — never `any`.

```ts
@Get('me')
getMe(@CurrentUser() user: User) {
  return this.usersService.findById(user.id)
}
```

---

## SSE Streaming

Used for LLM token streaming and platform sync progress. Always `Observable<MessageEvent>`.

```ts
// Controller — SSE endpoints are @Post (they need a body)
@Post('recommend/stream')
@Sse()
@PlanFeature('aiRecommendations')
@UseGuards(PlanGuard)
async streamRecommendation(
  @CurrentUser() user: User,
  @Body(new ZodValidationPipe(RecommendationRequestSchema)) body: RecommendationRequest,
): Promise<Observable<MessageEvent>> {
  const context = await this.aiService.buildContext(user.id, body)
  return this.aiService.streamRecommendation(context).pipe(
    map((token) => ({ data: { token } }) as MessageEvent),
  )
}
```

**Rules:**
- SSE endpoints are always `@Post` — they need a request body for context
- Always `async` — context building happens before the Observable is returned
- Token payload shape is `{ data: { token: string } }` — consistent, frontend relies on it
- Errors: catch in the Observable pipe, emit `{ data: { error: string } }`, then complete

---

## BullMQ Jobs

Used for Steam sync and any long-running background work that must not block a request.

### Queue setup

```ts
// platforms.module.ts
BullModule.registerQueue({ name: 'steam-sync' })
```

### Processor

```ts
@Processor('steam-sync')
export class SteamSyncProcessor extends WorkerHost {
  constructor(
    private steamService: SteamService,
    private gamesService: GamesService,
    private igdbService: IgdbService,
    private prisma: PrismaService,
  ) { super() }

  async process(job: Job<{ userId: string; steamId: string }>): Promise<void> {
    const { userId, steamId } = job.data
    // all sync logic here
  }
}
```

### Enqueueing

```ts
// In service — never in controller
async enqueueSteamSync(userId: string): Promise<{ queued: boolean }> {
  const platform = await this.prisma.userPlatform.findUnique({
    where: { userId_platform: { userId, platform: Platform.STEAM } },
  })
  if (!platform) return { queued: false }
  await this.steamQueue.add(
    'sync',
    { userId, steamId: platform.externalId },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
  )
  return { queued: true }
}
```

**Rules:**
- Always set `attempts` and `backoff` — external APIs fail
- Job data must be plain serializable objects — no class instances, no Prisma models
- Processors registered as providers in the feature module, not in `AppModule`

---

## Cron Jobs

Use `@nestjs/schedule` for periodic tasks. Keep schedulers in their own file per module.

```ts
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class SteamSyncScheduler {
  constructor(private steamService: SteamService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async handlePeriodicSync(): Promise<void> {
    await this.steamService.enqueueAllPendingSyncs()
  }
}
```

Register as a provider in the feature module — never directly in `AppModule`.

---

## Error Handling

Use NestJS built-in HTTP exceptions — never throw raw `Error` or `new Error()`.

```ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

// Resource not found or ownership check failed
throw new NotFoundException('Game not found')

// Plan restriction
throw new ForbiddenException('Feature requires a higher plan')

// Duplicate entry (@@unique violation)
throw new ConflictException('Game already in library')

// Invalid state (pre-condition not met)
throw new BadRequestException('Steam account not connected')
```

All exceptions caught by `HttpExceptionFilter`, returned as:
```json
{ "error": { "message": "...", "statusCode": 404 }, "statusCode": 404 }
```

---

## Prisma Conventions

### Query patterns

```ts
// Always scope to userId — never query without it
const games = await this.prisma.userGame.findMany({
  where: { userId, status },     // userId always first
  orderBy: { updatedAt: 'desc' },
  take: limit,
  skip: offset,
})

// Multi-step mutations — always transactional
const [session] = await this.prisma.$transaction([
  this.prisma.playSession.create({ data: sessionData }),
  this.prisma.userGame.update({
    where: { id: dto.gameId },
    data: { playtimeHours: { increment: dto.durationMin / 60 } },
  }),
])

// Parallel independent queries — always Promise.all
const [total, byStatus, agg] = await Promise.all([
  this.prisma.userGame.count({ where: { userId } }),
  this.prisma.userGame.groupBy({ by: ['status'], where: { userId }, _count: true }),
  this.prisma.userGame.aggregate({ where: { userId }, _sum: { playtimeHours: true } }),
])
```

### Schema rules

```prisma
// Indexes — every field used in where clauses
@@index([userId, status])      // compound for filtered list queries
@@unique([userId, igdbId])     // prevents duplicates per user

// Cascades — always on relations pointing to User
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

### Null → undefined mapping

Prisma returns `null` for optional fields. Always map in `_toResponse`:

```ts
// CORRECT
coverUrl: game.coverUrl ?? undefined,

// WRONG — null leaks into JSON response as null
coverUrl: game.coverUrl,
```

---

## Config Pattern

Access all config through typed `ConfigService`. Never use `process.env` directly in services or controllers.

```ts
// CORRECT
const apiKey = this.config.get<string>('app.steam.apiKey')

// WRONG
const apiKey = process.env.STEAM_API_KEY   // NO
```

Every new environment variable must be registered in `app.config.ts` before use.

---

## LLM Provider Pattern

Provider interface enables swappable LLM backends without touching business logic.

```ts
// llm-provider.interface.ts
export interface LLMProvider {
  recommend(context: RecommendationContext): Observable<string>
}
```

Provider selection at service init — never hardcoded:

```ts
constructor(
  private config: ConfigService,
  private grokProvider: GrokProvider,
  private claudeProvider: ClaudeProvider,
) {
  const name = this.config.get<string>('app.llm.provider', 'grok')
  this.provider = name === 'claude' ? this.claudeProvider : this.grokProvider
}
```

Adding a new provider: implement `LLMProvider`, register in `ai.module.ts`, add selection branch in constructor. Zero changes to controller or business logic.

---

## Import Order (strict — blank line between each group)

```ts
// 1. NestJS core
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'

// 2. External libraries
import { Queue } from 'bullmq'
import { Observable, map } from 'rxjs'

// 3. Shared package
import { CreateGameDto, GameStatus, PLAN_FEATURES } from '@grimoire/shared'

// 4. Internal (cross-module)
import { PrismaService } from '../../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'

// 5. Local (same module)
import { UserGameResponse, GameStatsResponse } from './games.types'
```

---

## Naming Conventions

| Thing            | Convention          | Example                   |
| ---------------- | ------------------- | ------------------------- |
| Module file      | `<feature>.module.ts`     | `games.module.ts`   |
| Controller class | `<Feature>Controller`     | `GamesController`   |
| Service class    | `<Feature>Service`        | `GamesService`      |
| Processor class  | `<Feature>Processor`      | `SteamSyncProcessor`|
| Scheduler class  | `<Feature>Scheduler`      | `SteamSyncScheduler`|
| Response type    | `<Entity>Response`        | `UserGameResponse`  |
| Private method   | `_camelCase`              | `_findOwned`, `_toResponse` |
| Queue name       | kebab-case string         | `'steam-sync'`      |
| Job name         | kebab-case string         | `'sync'`            |
| Config key       | dot-path string           | `'app.steam.apiKey'`|

---

## API Conventions

- Global prefix: `/api/v1`
- REST for CRUD: `GET /games`, `POST /games`, `PATCH /games/:id`, `DELETE /games/:id`
- SSE for streams: `POST /ai/recommend/stream`
- Stats endpoints: `GET /games/stats` — always before `/:id` in controller to avoid route shadowing
- All success responses: `{ data: T }` — via `TransformInterceptor`
- All error responses: `{ error: { message, statusCode }, statusCode }` — via `HttpExceptionFilter`
- Query params: camelCase — `?status=PLAYING`, `?limit=20`
- Pagination: `?page=1&limit=20` — offset-based, consistent across all list endpoints

---

## Pre-Commit Checklist

Before finalizing any backend change, verify all of the following:

- [ ] All files are TypeScript — zero `.js` files
- [ ] Every new endpoint has `@UseGuards(AuthGuard)` at controller or method level
- [ ] Plan-gated endpoints have `@PlanFeature(...)` + `@UseGuards(PlanGuard)`
- [ ] All request bodies and query params use `ZodValidationPipe` + shared schema
- [ ] Zero Prisma queries in controllers
- [ ] Zero business logic in controllers
- [ ] All new Prisma models have `userId` field
- [ ] All relations to `User` have `onDelete: Cascade`
- [ ] New indexes added for every field used in `where` clauses
- [ ] Response uses `<Entity>Response` type — not raw Prisma type
- [ ] Optional Prisma fields mapped with `?? undefined` in `_toResponse`
- [ ] Ownership verified via `_findOwned` before any mutation
- [ ] Independent parallel queries use `Promise.all`
- [ ] Multi-step mutations use `prisma.$transaction`
- [ ] BullMQ jobs have `attempts` and `backoff` options set
- [ ] New module registered in `AppModule`
- [ ] New env var registered in `app.config.ts`
- [ ] Config accessed via `ConfigService` — never `process.env`
- [ ] Private methods prefixed with `_`
- [ ] Imports follow the 5-group order with blank lines between groups
- [ ] Stats/named routes declared before `/:id` in controller to avoid shadowing
- [ ] File ends with a newline
