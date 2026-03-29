# Admin & Auth Usage Flow — Implementation Plan

Self-hosted app, no open registration. Admin creates and manages all accounts. AI usage is gated and trackable.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prisma Schema Changes](#2-prisma-schema-changes)
3. [Migration](#3-migration)
4. [Backend: Auth Overhaul](#4-backend-auth-overhaul)
5. [Backend: Guards](#5-backend-guards)
6. [Backend: Admin Module & Endpoints](#6-backend-admin-module--endpoints)
7. [Backend: AI Request Tracking](#7-backend-ai-request-tracking)
8. [Backend: Users Endpoint Changes](#8-backend-users-endpoint-changes)
9. [Frontend: Routing Changes](#9-frontend-routing-changes)
10. [Frontend: Auth Flow](#10-frontend-auth-flow)
11. [Frontend: ProtectedRoute Changes](#11-frontend-protectedroute-changes)
12. [Frontend: LoginPage Refactor](#12-frontend-loginpage-refactor)
13. [Frontend: Change Password Page](#13-frontend-change-password-page)
14. [Frontend: Admin Dashboard Page](#14-frontend-admin-dashboard-page)
15. [Frontend: RTK Query Additions](#15-frontend-rtk-query-additions)
16. [Frontend: AI Panel Changes](#16-frontend-ai-panel-changes)
17. [Tests](#17-tests)
18. [TypeScript & ESLint](#18-typescript--eslint)

---

## 1. Overview

### Flow

1. Every route (except `/login` and the one-time `/admin/setup`) requires authentication.
2. No open registration. Admin creates all accounts via the Admin Dashboard.
3. `POST /admin/setup` — callable only when zero users exist in the DB. Creates the first admin account.
4. Users created by admin have `mustChangePassword: true`; on first login they are forced to `/change-password` before accessing the app.
5. Admin dashboard: manage accounts, view per-user game/AI stats, configure AI availability.

### Not changed in this iteration

- `Plan` / `PlanGuard` / Stripe flow — left intact.
- Steam sync, IGDB, sessions — left intact.
- Better Auth session mechanics (cookie-based, Better Auth manages the `Account` / `Session` / `VerificationToken` tables).

---

## 2. Prisma Schema Changes

### 2.1 New `Role` enum

```prisma
enum Role {
  ADMIN
  USER
}
```

### 2.2 Additive changes to `User` model

| Field | Type | Default | Purpose |
|---|---|---|---|
| `role` | `Role` | `USER` | Distinguishes admin from regular users |
| `passwordHash` | `String?` | `null` | bcrypt hash; kept in sync with Better Auth's `Account.password` |
| `mustChangePassword` | `Boolean` | `false` | Set `true` when admin creates account; cleared on first password change |
| `aiEnabled` | `Boolean` | `true` | Per-user AI toggle; can be overridden to `false` by admin |
| `aiRequestsUsed` | `Int` | `0` | Lifetime request counter |
| `aiRequestsLimit` | `Int?` | `null` | `null` = no limit; positive integer = hard cap |

Resulting diff (new lines only):

```prisma
model User {
  // ... all existing fields unchanged ...
  role               Role    @default(USER)
  passwordHash       String?
  mustChangePassword Boolean @default(false)
  aiEnabled          Boolean @default(true)
  aiRequestsUsed     Int     @default(0)
  aiRequestsLimit    Int?
}
```

### 2.3 New `AiGlobalSettings` singleton model

```prisma
model AiGlobalSettings {
  id        Int     @id @default(1)
  aiEnabled Boolean @default(true)
}
```

`id` is always `1`. All writes use `upsert`. This avoids unbounded `findFirst` and makes the contract explicit.

---

## 3. Migration

**Migration name:** `add_role_password_ai_admin_settings`

The migration is additive only:

1. Create `Role` enum (`ADMIN`, `USER`).
2. `ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER'`.
3. `ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT`.
4. `ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT FALSE`.
5. `ALTER TABLE "User" ADD COLUMN "aiEnabled" BOOLEAN NOT NULL DEFAULT TRUE`.
6. `ALTER TABLE "User" ADD COLUMN "aiRequestsUsed" INTEGER NOT NULL DEFAULT 0`.
7. `ALTER TABLE "User" ADD COLUMN "aiRequestsLimit" INTEGER`.
8. `CREATE TABLE "AiGlobalSettings" ("id" INTEGER PRIMARY KEY DEFAULT 1, "aiEnabled" BOOLEAN NOT NULL DEFAULT TRUE)`.
9. Seed singleton: `INSERT INTO "AiGlobalSettings" ("id", "aiEnabled") VALUES (1, TRUE) ON CONFLICT DO NOTHING`.

No column renames. No column drops. No data transformations on existing rows.

---

## 4. Backend: Auth Overhaul

### 4.1 Strategy — keep Better Auth as session layer

Better Auth continues to issue/validate sessions and own the `Account` / `Session` tables. The new requirements are layered on top:

- Admin-creates-accounts path writes both `User.passwordHash` (for quick local validation) **and** creates a Better Auth `Account` row (`providerId = 'credential'`). This keeps the two stores in sync.
- `PATCH /users/me/password` updates both stores.
- `mustChangePassword` is enforced by a dedicated guard (see section 5).

### 4.2 Block open registration

In `AuthController`'s catch-all passthrough to Better Auth, add a guard at the top:

```ts
if (req.method === 'POST' && req.url.includes('sign-up')) {
  throw new ForbiddenException('Registration is not open')
}
```

This blocks `POST /auth/sign-up/email` with 403 while leaving all other Better Auth routes (sign-in, sign-out, session refresh) intact.

### 4.3 First-run setup endpoint

**Route:** `POST /admin/setup` — **public**, no auth guard.

**Body schema (`SetupAdminSchema` — add to `@grimoire/shared`):**

```ts
z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
})
```

**Logic:**

1. `count = await prisma.user.count()`. If `count > 0` → `ForbiddenException('Setup already completed')`.
2. `hash = await bcrypt.hash(password, 12)`.
3. `prisma.$transaction`:
   - `prisma.user.create({ data: { email, name, role: 'ADMIN', passwordHash: hash, mustChangePassword: false } })`
   - `prisma.account.create({ data: { providerId: 'credential', accountId: email, password: hash, userId: user.id } })`
4. Return `{ id, email, role, createdAt }` (201).

### 4.4 `bcrypt` dependency

Install `bcrypt` + `@types/bcrypt` (or `bcryptjs` + `@types/bcryptjs` — confirm against existing stack; pick one and be consistent).

---

## 5. Backend: Guards

### 5.1 `AdminGuard`

**File:** `apps/api/src/common/guards/admin.guard.ts`

Runs after `AuthGuard` (which populates `req.user`). Checks `req.user.role === 'ADMIN'`; throws `ForbiddenException('Admin access required')` otherwise.

**Convenience decorator:**

```ts
// apps/api/src/common/decorators/admin-only.decorator.ts
export const AdminOnly = () => applyDecorators(UseGuards(AuthGuard, AdminGuard))
```

### 5.2 `MustChangePasswordGuard`

**File:** `apps/api/src/common/guards/must-change-password.guard.ts`

Applied **globally** in `main.ts` after `AuthGuard`.

Logic:
- If `req.user.mustChangePassword === true`, throw `ForbiddenException` with code `MUST_CHANGE_PASSWORD` in the body.
- Exempt route: `PATCH /users/me/password` — use a `@SkipMustChangePassword()` metadata decorator checked via `Reflector`.

### 5.3 `RequestUser` interface

Replace `user: any` in all controllers with a typed interface:

```ts
// apps/api/src/common/decorators/current-user.decorator.ts
export interface RequestUser {
  id: string
  email: string
  role: Role
  plan: Plan
  mustChangePassword: boolean
}
```

---

## 6. Backend: Admin Module & Endpoints

### 6.1 Module structure

```
apps/api/src/modules/admin/
  admin.module.ts
  admin.controller.ts
  admin.service.ts          — user CRUD + stats
  admin-ai.service.ts       — AI settings (separate file to keep services ≤ 300 lines)
  admin.types.ts
```

`AdminModule` imports `PrismaModule` and is registered in `AppModule`. All controller methods use `@AdminOnly()` except `POST /admin/setup`.

### 6.2 Shared Zod schemas (add to `@grimoire/shared`)

| Schema | Fields |
|---|---|
| `SetupAdminSchema` | `email`, `password`, `name?` |
| `CreateUserSchema` | `email`, `password`, `name?` |
| `ChangePasswordSchema` | `currentPassword: z.string().min(1)`, `newPassword: z.string().min(8)` |
| `UpdateAiSettingsSchema` | `globalEnabled?: z.boolean()`, `userId?: z.string().cuid()`, `userEnabled?: z.boolean()`, `userLimit?: z.number().int().min(0).nullable()` |

### 6.3 Endpoints

---

#### `POST /admin/setup` — public

See section 4.3. Returns `AdminUserResponse` (201).

---

#### `GET /admin/users` — `@AdminOnly()`

Query: `?page=1&limit=20`

Prisma: `findMany` on `User` with `_count: { select: { games: true } }` to co-locate game count.

Response `AdminUserListResponse`:

```ts
{
  data: AdminUserResponse[]
  total: number
}
```

`AdminUserResponse`:

```ts
{
  id, email, name?, role, plan, mustChangePassword,
  aiEnabled, aiRequestsUsed, aiRequestsLimit?,
  gamesCount, createdAt
}
```

---

#### `POST /admin/users` — `@AdminOnly()`

Body: `CreateUserSchema`

Logic:
1. Check email uniqueness → `ConflictException` if taken.
2. `hash = bcrypt.hash(password, 12)`.
3. `prisma.$transaction`: create `User` (`role: USER`, `mustChangePassword: true`, `passwordHash: hash`) + create Better Auth `Account` row.
4. Return `AdminUserResponse` (201).

---

#### `DELETE /admin/users/:id` — `@AdminOnly()`

Logic:
1. `adminId === targetId` → `BadRequestException('Cannot delete your own account')`.
2. Fetch target → `NotFoundException` if not found.
3. `prisma.user.delete` (cascades all related records).
4. Return 204.

---

#### `GET /admin/stats` — `@AdminOnly()`

Prisma: `findMany` on `User` selecting `id`, `email`, `name`, `aiRequestsUsed`, `aiRequestsLimit`, `_count: { games, sessions }`.

Response:

```ts
{
  users: Array<{
    id, email, name?,
    gamesCount, sessionsCount,
    aiRequestsUsed, aiRequestsLimit?
  }>
}
```

---

#### `PATCH /admin/ai-settings` — `@AdminOnly()`

Body: `UpdateAiSettingsSchema`

Logic:
- `globalEnabled` present → `prisma.aiGlobalSettings.upsert`.
- `userId` + `userEnabled`/`userLimit` present → `prisma.user.update`.
- Both can be exercised in the same request (`Promise.all`).

Response: `{ globalEnabled: boolean, updatedUser?: AdminUserResponse }`

---

## 7. Backend: AI Request Tracking

### 7.1 `_checkAndIncrementAiUsage(userId: string)` in `AiService`

Called at the start of `buildContext`, before any LLM work:

1. Fetch `AiGlobalSettings` (treat missing row as `{ aiEnabled: true }`).
2. `globalSettings.aiEnabled === false` → `ForbiddenException('AI features are globally disabled')`.
3. Fetch user `{ aiEnabled, aiRequestsUsed, aiRequestsLimit }`.
4. `user.aiEnabled === false` → `ForbiddenException('AI features are disabled for your account')`.
5. `user.aiRequestsLimit !== null && user.aiRequestsUsed >= user.aiRequestsLimit` → `ForbiddenException('AI request limit reached')`.
6. `prisma.user.update({ data: { aiRequestsUsed: { increment: 1 } } })` — happens before stream start.

### 7.2 Guard order

`AuthGuard` → `PlanGuard` → `_checkAndIncrementAiUsage` (inside service). The increment is intentionally consumed even if the LLM call subsequently fails.

### 7.3 Reset strategy

`aiRequestsUsed` is a lifetime counter. A rolling-period reset can be added later (add `aiRequestsResetAt DateTime?` + a `@nestjs/schedule` cron job). No schema change needed now; the plain `Int` accommodates zeroing.

---

## 8. Backend: Users Endpoint Changes

### 8.1 `PATCH /users/me/password`

**Decorator:** `@SkipMustChangePassword()` — reachable even when `mustChangePassword === true`.

**Body:** `ChangePasswordSchema`

**Logic (`UsersService.changePassword`):**

1. Fetch user with `passwordHash` (internal select only — never exposed via `_toResponse`).
2. `bcrypt.compare(currentPassword, user.passwordHash)` → `UnauthorizedException` on mismatch.
3. `newHash = bcrypt.hash(newPassword, 12)`.
4. `prisma.$transaction`:
   - `prisma.user.update({ data: { passwordHash: newHash, mustChangePassword: false } })`
   - `prisma.account.update` for Better Auth credential row.
5. Return 204.

### 8.2 `UserResponse` additions

Add to `UserResponse` in `users.types.ts`:

```ts
role: 'ADMIN' | 'USER'
mustChangePassword: boolean
```

`_toResponse` mapper updated accordingly. `passwordHash`, `aiEnabled`, `aiRequestsUsed`, `aiRequestsLimit` are **never** in `UserResponse` — those are admin-only fields.

---

## 9. Frontend: Routing Changes

### Target route tree

```
/login                   — public (replaces /auth)
/admin/setup             — semi-public; shows first-run form only when no users exist
/admin/dashboard         — protected, admin role required
/change-password         — protected (any authed user), only reachable while mustChangePassword=true
/                        → redirect to /library
/library                 — protected
/games/:id               — protected
/settings                — protected
```

### Changes to `App.tsx`

- Rename `/auth` → `/login`, mount `<LoginPage />`.
- Add `<Route path='/admin/setup' element={<AdminSetupPage />} />` (public).
- Wrap `/admin/dashboard` in `<AdminRoute>` (admin-only protected route variant).
- Wrap `/change-password` in `<MustChangePasswordRoute>`.
- Update all `navigate('/auth')` / `<Navigate to='/auth'>` → `/login`.

---

## 10. Frontend: Auth Flow

### Sign-in sequence

1. `/login` — if valid session exists, redirect immediately to `/`.
2. Submit email + password → `signIn` mutation.
3. On success inspect session:
   - `session.user.mustChangePassword === true` → `navigate('/change-password', { replace: true })`.
   - `session.user.role === 'ADMIN'` → `navigate('/admin/dashboard', { replace: true })`.
   - Otherwise → `navigate('/', { replace: true })`.

### Extended `Session` type in `authApi.ts`

```ts
export interface Session {
  user: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'USER'
    mustChangePassword: boolean
    aiEnabled: boolean
    aiRequestLimit: number | null
  }
}
```

### Sign-out

After mutation, navigate to `/login`. Existing `invalidatesTags` (`'User'`, `'Game'`, `'Session'`, `'Stats'`) covers full cache flush.

---

## 11. Frontend: ProtectedRoute Changes

### `ProtectedRoute` updates

- `<Navigate to='/auth' replace />` → `<Navigate to='/login' replace />`.
- After session exists, before rendering `<Outlet />`:
  ```tsx
  if (session.user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to='/change-password' replace />
  }
  ```

### New `AdminRoute`

**File:** `apps/web/src/shared/components/ProtectedRoute/AdminRoute.tsx`

- No session → `/login`.
- Session exists but `role !== 'ADMIN'` → `/`.
- Admin → `<Outlet />`.

### New `MustChangePasswordRoute`

**File:** `apps/web/src/shared/components/ProtectedRoute/MustChangePasswordRoute.tsx`

- No session → `/login`.
- `mustChangePassword === false` → `/` (prevents back-navigation after completing change).
- Otherwise → `<Outlet />`.

---

## 12. Frontend: LoginPage Refactor

**Rename:** `AuthPage.tsx` → `LoginPage.tsx` (move to `pages/LoginPage.tsx`).

**Remove:**
- All sign-up state, `handleSignUp`, `useSignUpMutation` import.
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` structure.

**Keep:**
- Same visual shell (`bg-grimoire-deep`, centred card, `font-grimoire` heading).
- Same email + password fields and error paragraph style.
- Post-login three-branch navigation (section 10).

Update `App.tsx` import accordingly.

---

## 13. Frontend: Change Password Page

**File:** `apps/web/src/pages/ChangePasswordPage.tsx`

Same centred card shell as `LoginPage`. No container needed (owns `useState` directly).

### Fields

- Current (temporary) password — `type='password'`, `autoComplete='current-password'`.
- New password — `type='password'`, `autoComplete='new-password'`, `minLength={8}`.
- Confirm new password — `type='password'`.

### Validation

Client-side: new password and confirm must match before submitting.

### Submission

Calls `changePassword` mutation (section 15). On success: RTK Query invalidates `'User'` tag (refetches session, sets `mustChangePassword: false`), then `navigate('/', { replace: true })`.

Cannot be dismissed — `MustChangePasswordRoute` prevents navigating away until `mustChangePassword` is cleared.

---

## 14. Frontend: Admin Dashboard Page

### File structure

```
pages/
  AdminDashboardPage.tsx

features/admin/
  components/
    AdminDashboard/
      AdminDashboard.tsx            — presentational
      AdminDashboardContainer.tsx   — data + dispatch
    CreateUserDialog/
      CreateUserDialog.tsx
      CreateUserDialogContainer.tsx
    UserRow/
      UserRow.tsx
  adminApi.ts
```

### Key types

```ts
interface AdminUserRow {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER'
  gamesCount: number
  aiRequestCount: number
  aiEnabled: boolean
  aiRequestLimit: number | null
}

interface CreateUserArgs {
  name: string
  email: string
  password: string
}
```

### Layout

**Header:** page title `"Admin"` in `font-grimoire text-xl text-grimoire-ink`, right-aligned "Create user" `Button` (`bg-grimoire-gold text-grimoire-deep`).

**AI global toggle:** label `"AI features"` + Shadcn `Switch` (thumb gold when on).

**User table** (Shadcn `Table`):

| Column | Notes |
|---|---|
| Name / Email | Stacked — name `font-grimoire text-sm`, email `font-sans text-xs text-grimoire-muted` |
| Role | Badge following existing `STATUS_STYLES` pattern |
| Games | Numeric |
| AI requests | Numeric; `—` when AI disabled for user |
| AI enabled | Per-user `Switch`; disabled when global AI is off |
| Request limit | Numeric `Input`, placeholder `"∞"`, empty = no limit; disabled when AI off |
| Actions | `Trash2` icon button → Shadcn `AlertDialog` confirmation |

**Loading state:** `Skeleton` rows. **Empty state:** `"No users yet."`.

### `CreateUserDialog`

Shadcn `Dialog`. Fields: Name, Email, Password. Submit "Create user". Error display on API failure. Submitting sets `mustChangePassword: true` on the backend.

---

## 15. Frontend: RTK Query Additions

### New tag type

Add `'AdminUser'` to the tag types in `apps/web/src/app/api.ts`.

### `features/admin/adminApi.ts` (new file, `api.injectEndpoints`)

```ts
listUsers        → GET  admin/users             providesTags: ['AdminUser']
createUser       → POST admin/users             invalidatesTags: ['AdminUser']
deleteUser       → DELETE admin/users/:id       invalidatesTags: ['AdminUser']
getAiSettings    → GET  admin/settings/ai       providesTags: ['AdminUser']
updateAiSettings → PATCH admin/settings/ai      invalidatesTags: ['AdminUser', 'User']
getStats         → GET  admin/stats             providesTags: ['AdminUser']
```

### `authApi.ts` changes

- Extend `Session.user` type (section 10).
- Remove `signUp` endpoint and `useSignUpMutation` export.
- Add:
  ```ts
  changePassword: builder.mutation<void, { currentPassword: string; newPassword: string }>({
    query: (body) => ({ url: 'users/me/password', method: 'PATCH', body }),
    invalidatesTags: ['User'],
  })
  ```

### `usersApi.ts` changes

- Update `User` type to include `role`, `mustChangePassword`, `aiEnabled`, `aiRequestLimit` (mirrors `@grimoire/shared` type update).
- No new endpoints needed.

---

## 16. Frontend: AI Panel Changes

### New prop `aiEnabled: boolean` on `IAiPanel`

`AiPanelContainer` reads `aiEnabled` from `useGetMeQuery()` and passes it down.

### Disabled state

When `aiEnabled === false`:

- All mood buttons, session-length buttons, and submit button rendered `disabled` + `opacity-40`.
- Notice above button:
  ```tsx
  <p className='font-sans text-xs text-grimoire-muted text-center'>
    AI features are currently disabled for your account.
  </p>
  ```
- Button disabled condition: `!aiEnabled || isStreaming || selectedMoods.length === 0`.
- `onRequest` guard in container: `if (!aiEnabled) return`.

### No slice changes

`aiEnabled` is server state from `useGetMeQuery`. When admin toggles global AI, `updateAiSettings` invalidates `'User'`, `getMe` refetches, `AiPanelContainer` receives updated `aiEnabled`.

---

## 17. Tests

### Backend unit tests

| File | Coverage |
|---|---|
| `admin.service.spec.ts` | `createUser`: happy path, duplicate email; `deleteUser`: self-deletion rejection, not-found; stats query shape |
| `admin-ai.service.spec.ts` | `updateAiSettings`: global toggle, per-user toggle, per-user limit, combined |
| `ai.service.spec.ts` | `_checkAndIncrementAiUsage`: global disabled, user disabled, limit reached, under limit (increment called), no limit (increment called) |
| `users.service.spec.ts` | `changePassword`: wrong current password, success (hash updated, `mustChangePassword` cleared) |
| `admin.guard.spec.ts` | Non-admin rejected; admin allowed; unauthenticated rejected |
| `must-change-password.guard.spec.ts` | `mustChangePassword: true` throws on protected routes; passes on `PATCH /users/me/password` |

All unit tests mock `PrismaService`. No real DB.

### Backend e2e tests

| Scenario |
|---|
| `POST /admin/setup` success (empty DB) |
| `POST /admin/setup` blocked (users exist) |
| Sign-in returns session cookie |
| `mustChangePassword: true` — all endpoints except change-password return 403 with `MUST_CHANGE_PASSWORD` |
| `PATCH /users/me/password` clears flag; subsequent request succeeds |
| Admin creates user (`mustChangePassword: true` on created user) |
| Admin deletes user (cascade verified) |
| `PATCH /admin/ai-settings` global disable → stream endpoint returns 403 |
| Per-user AI limit: 2 requests succeed, 3rd returns 403 |
| Non-admin hitting `GET /admin/users` returns 403 |
| `POST /auth/sign-up/email` returns 403 |

E2E uses a dedicated test DB, seeded fresh per suite via `prisma migrate reset --force`.

### Frontend component tests (Vitest + RTL)

| Component | Key scenarios |
|---|---|
| `LoginPage` | Renders sign-in only; success navigates to `/`; `mustChangePassword=true` → `/change-password`; admin role → `/admin/dashboard`; API error shows message |
| `ProtectedRoute` | Loading → skeleton; no session → `/login`; `mustChangePassword=true` → `/change-password` |
| `AdminRoute` | No session → `/login`; non-admin → `/`; admin → `<Outlet />` |
| `MustChangePasswordRoute` | No session → `/login`; `mustChangePassword=false` → `/`; `mustChangePassword=true` → `<Outlet />` |
| `ChangePasswordPage` | Mismatched passwords → error, no submit; success → navigate `/` |
| `AdminDashboard` | Rows rendered; loading skeletons; empty state; delete triggers confirmation; AI switches call handlers |
| `CreateUserDialog` | Form submission calls `onCreateUser`; API error shown inside dialog |
| `AiPanel` | `aiEnabled=false` disables all controls and shows notice; `aiEnabled=true` restores behaviour |

### Frontend integration tests (MSW)

| Scenario |
|---|
| Login → forced password change → redirect to `/library` |
| Admin login → `/admin/dashboard` + `admin/users` fetch |
| Non-admin attempts `/admin/dashboard` → redirect to `/` |
| First-run setup form renders; after creation redirects to `/login` |

---

## 18. TypeScript & ESLint

### Shared types in `@grimoire/shared`

Add:
```ts
export type UserRole = 'ADMIN' | 'USER'
export enum Role { ADMIN = 'ADMIN', USER = 'USER' }  // mirror Prisma enum
```

Use `UserRole` (not bare `string`) in `Session`, `User`, `AdminUserRow`, `CreateUserArgs` everywhere.

### Remove `any` from controllers

Three locations use `user: any` today (`UsersController.getMe`, `UsersController.updateMe`, `AiController.streamRecommendation`). Update all to `user: RequestUser`.

### `passwordHash` leakage prevention

`passwordHash` must never appear in any `_toResponse` method. All `prisma.user.findMany` / `findUnique` calls in public-facing services must use an explicit `select` object that omits `passwordHash`.

### `aiRequestLimit` input field

Wherever rendered in `<Input>`, the controlled value must be `string` (HTML contract). Use `useState<string>` locally, parse to `number | null` on blur/submit.

### Remove `useSignUpMutation`

After removing `signUp` from `authApi.ts`, ensure no other file imports `useSignUpMutation`. TypeScript's missing-export error surfaces this automatically.

### Exhaustive role checks

In `ProtectedRoute` variants and any UI branching on role, use:

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled role: ${x}`)
}
```

This ensures TypeScript catches missing branches if a third role is added.