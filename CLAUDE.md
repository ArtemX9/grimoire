# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
pnpm dev                        # Start all (shared watch + api :3000 + web :5173)
pnpm --filter api dev           # API only
pnpm --filter web dev           # Web only
```

### Testing

```bash
pnpm test                       # All tests across all packages
pnpm --filter api test          # API unit tests (Jest)
pnpm --filter web test          # Web unit tests (Vitest, watch mode)
pnpm --filter web test:run      # Web unit tests (single run, for CI)
pnpm --filter web e2e           # Playwright E2E tests

# Run a single test file
pnpm --filter api test -- --testPathPattern=sessions.service
pnpm --filter web test -- sessions
```

### Linting & type checking

```bash
pnpm lint                       # Lint all packages
pnpm typecheck                  # Typecheck all packages
pnpm --filter api lint:fix      # Auto-fix API lint issues
pnpm --filter web lint:fix      # Auto-fix web lint issues
```

### Database

```bash
pnpm db:migrate                 # Create and run a new migration (dev)
pnpm db:generate                # Regenerate Prisma client after schema change
pnpm db:studio                  # Open Prisma Studio
```

### Docker

```bash
docker compose up postgres redis -d                        # Local infra only
docker compose up -d                                       # Full local stack
docker compose -f docker-compose.prod.yml up -d --build   # NAS / prod (do NOT use --rmi all)
```

---

## Architecture

This is a pnpm monorepo: `apps/api` (NestJS), `apps/web` (React + Vite), `packages/shared` (Zod schemas, TS types, enums).

### Backend (`apps/api`)

Standard NestJS modules under `src/modules/` — each module owns its controller, service, and spec. Common infrastructure lives in `src/common/` (decorators, guards, filters, pipes). Prisma service is in `src/prisma/`.

Key modules:
- `games/` — CRUD, status changes, re-map to different IGDB entry
- `sessions/` — play session logging with daily cap enforcement
- `platforms/steam/` — OAuth + background library sync (BullMQ)
- `igdb/` — search and metadata fetch
- `ai/` — LLM adapter (Grok default, Claude/OpenAI fallback), SSE streaming

Auth is handled by **Better Auth** (not Passport). All protected routes use `AuthGuard`. Admin routes use `@AdminOnly()` which composes `AuthGuard + AdminGuard`. Plan-gated features use `@Plan(PlanFeature.X) + PlanGuard`.

**Naming conventions:**
- IDs and URLs use ALL_CAPS suffixes: `igdbID`, `steamAppID`, `coverURL`
- Prefer enums over string primitives everywhere

### Frontend (`apps/web`)

Role-based layout:
- `src/api/` — all RTK Query slices, one file per backend module (flat, never nested)
- `src/store/` — Redux slices for client state (`filtersSlice`, `aiSlice`, `uiSlice`, `gamesSlice`)
- `src/components/` — shared/cross-page components + all Shadcn/ui primitives in `components/ui/`
- `src/pages/` — one folder per route; page-specific sub-components co-located in `pages/XxxPage/components/`
- `src/hooks/` — shared custom hooks

Every route string lives in `src/constants/routes.ts` — use `ROUTES.XXX` everywhere, never inline strings. Parameterised URLs use a helper exported from the same file (e.g. `getGameDetailsURL(id)`).

### RTK Query ↔ Redux slice sync

RTK Query's `onQueryStarted` and `extraReducers.matchFulfilled` only fire on network requests — **not cache hits**. Cache hits bypass them entirely.

The pattern used here:
1. `gamesSlice.ts` has `extraReducers` with string-based matchers (avoids a circular import with `gamesApi.ts`):
   ```ts
   .addMatcher(
     (action) => action.type === 'api/executeQuery/fulfilled' && action.meta?.arg?.endpointName === 'getGames',
     (state, action) => { state.games = action.payload; ... }
   )
   ```
2. `useSliceSync(queryHook, args, actionCreator)` — a hook in `src/hooks/useSliceSync.ts` that calls the RTK hook internally and dispatches to the slice via `useEffect` on `data`. This handles cache hits. Both paths fire on network requests (harmless double-dispatch of the same data).

Use this pattern for any query that needs to sync into a Redux slice.

### Container / page split

Pages follow a container pattern: `XxxPageContainer.tsx` owns all hooks, RTK Query calls, and Redux state; `XxxPage.tsx` is purely presentational. This keeps pages testable and logic co-located.

### JSX conventions — lean return / render-function pattern

Every component's `return` must be a lean "table of contents" — readable at a glance without scrolling. Any JSX block longer than ~5–8 lines must be extracted into a named `renderXxx()` helper defined in the same component scope. The `return` delegates to these helpers like a book's chapter list.

```tsx
// Correct — lean return
return (
  <div className="layout">
    {renderHeader()}
    {renderContent()}
    {renderDialogs()}
  </div>
);

// Wrong — return contains inline implementation
return (
  <div className="layout">
    <header>
      <h1>{title}</h1>
      <Button onClick={handleAdd}>Add</Button>
    </header>
    <main>... 40 lines ...</main>
  </div>
);
```

A `{/* Section name */}` comment inside JSX is a signal that the block should be a `renderXxx()` function — extract it, remove the comment.

### Mobile responsiveness

Use `useIsMobile()` hook (`src/hooks/useMobile.ts`, breakpoint 768 px) when the mobile and desktop layouts are structurally different (e.g. Sidebar renders a fixed bottom nav on mobile vs. an `<aside>` on desktop). For same-element tweaks (font size, padding), use Tailwind responsive prefixes (`sm:`, `lg:`) directly.

### Shared package

`packages/shared` exports:
- Zod schemas (`schemas/`) — used for validation in both API (`ZodValidationPipe`) and web (form validation)
- TypeScript types (`types/`) — `UserGame`, `PlaySession`, `GameStatus`, etc.
- Constants/enums (`constants/`) — `Genre`, `Platform`, mood tags

Build shared first when working locally: `pnpm --filter shared build` (or `dev` for watch mode).

### RTK Query API file conventions

File layout: shared imports → base API import (`./api`, not `@/`) → type definitions → `BASE_URL_PATH` const → `api.injectEndpoints(...)` → hook exports. API files are `.ts` never `.tsx`.

Tag types: `'Game' | 'Session' | 'User' | 'AdminUser' | 'Stats'`

---

## Test factories

Factory functions for building typed test fixtures. Both packages use `@faker-js/faker` and the same naming pattern. Import from the barrel in each package.

### API factories — `apps/api/src/test/`

Import: `import { generateUser, generateGameResponse } from '../../test'`

| File | Exports |
| ---- | ------- |
| `user.factory.ts` | `generateUser` |
| `game.factory.ts` | `generateGameResponse`, `generateCreateGameDto`, `generateRemapGameDto` |
| `session.factory.ts` | `generateSession`, `generateSessionWithGame`, `generateCreateSessionDto` |
| `platform.factory.ts` | `generatePlatform`, `generateUserPlatformRow` |
| `index.ts` | re-exports all of the above |

### Web factories — `apps/web/src/test/`

Import: `import { generateUserGame, generateAdminUserRow } from '@/test'`

| File | Exports |
| ---- | ------- |
| `user.factory.ts` | `generateUser` (shared `User`), `generateSession` (authApi `Session`), `generateAdminUserRow` (adminApi `AdminUserRow`) |
| `game.factory.ts` | `generateUserGame` (shared `UserGame`), `generateIgdbGame` (shared `IgdbGame`) |
| `session.factory.ts` | `generatePlaySession` (shared `PlaySession`) |
| `platform.factory.ts` | `generateUserPlatform` (shared `UserPlatform`) |
| `index.ts` | re-exports all of the above |

### Naming conventions

- Factory functions: `generate<Entity>()` — e.g. `generateUser()`, `generateGameResponse()`
- Param interfaces: `IGenerate<Entity>` — e.g. `IGenerateUser`, `IGenerateGameResponse`
- All ID/URL fields follow the project convention: ALL_CAPS suffixes (`igdbID`, `coverURL`, `steamAppID`)

### When to use faker vs. hardcoded values

Use `faker` for fields the test doesn't assert on — id, email, title, dates. Use hardcoded values for fields under test:

```ts
// Test that only cares about status — let faker fill the rest
const game = generateUserGame({ status: GameStatus.COMPLETED });

// Test that asserts a specific user id is forwarded to the service
const user = generateUser({ id: 'user-42' });
expect(service.findAll).toHaveBeenCalledWith('user-42', ...);
```

### Rule

New spec files MUST use these factories. Inline fixture objects (`{ id: 'game-1', title: 'The Witcher 3', ... }` scattered across tests) are not allowed. If a factory is missing a field, add it to the factory — do not inline the object in the test.

---

## Data model notes

- Every table has `userId` — multi-tenancy is enforced at the data layer, not just the API layer.
- `PlaySession` has no `endedAt` — duration is stored directly as `durationMin`.
- `UserGame` has a `@@unique([userId, igdbId])` constraint — a user can't add the same IGDB game twice.
- AI request tracking: each user has `aiRequestsUsed` / `aiRequestsLimit` (nullable = no limit). `AiService` enforces this before any LLM call.