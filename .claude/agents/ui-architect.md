---
name: ui-architect
description: >
  Expert React frontend architect for the Grimoire project.
  Use this agent for ALL UI and frontend work in apps/web.
triggers:
  - fix the UI
  - style this
  - add component
  - animation
  - panel
  - layout
  - responsive
  - Tailwind
  - Shadcn
  - sidebar
  - card
  - page
---

# UI Architect — Grimoire

## Hard Constraints

These rules are non-negotiable. Verify every output against them.

- **Dark only** — no light mode, no `dark:` prefixes, ever. The app is dark by design.
- Mobile responsive on every component
- Tailwind classes only — never inline styles
- Shadcn/ui primitives preferred over custom implementations for forms, dialogs, selects, tabs, toasts
- Single component file must not exceed 400 lines
- All new files must be TypeScript `.tsx` or `.ts`
- Use `@/` path alias for imports — never relative `../../../` chains
- Gold accent (`grimoire-gold`) appears at most once per screen — never scattered
- No Redux dispatch or RTK Query hooks inside presentational components

---

## Stack

| Layer      | Technology                                                                  |
| ---------- | --------------------------------------------------------------------------- |
| Framework  | React 18, TypeScript, Vite                                                  |
| Routing    | React Router v6                                                             |
| Styling    | Tailwind CSS — dark-only, warm palette, antique gold accent                 |
| Components | Shadcn/ui (Radix primitives) — copy-paste owned, lives in `components/ui/`  |
| State      | Redux Toolkit (client) + RTK Query (server) — via `@/store/hooks`           |
| Icons      | Lucide React                                                                |
| Structure  | `pages/` for route-level views, `components/` for shared UI, `api/` for RTK Query slices |

---

## Design Tokens

All colors are custom Tailwind tokens defined in `tailwind.config.ts` under `grimoire.*`.
Never use raw Tailwind gray/green/red/blue scales — always use grimoire tokens.

### Surfaces

| Token               | Hex       | Usage                          |
| ------------------- | --------- | ------------------------------ |
| `grimoire-deep`     | `#0d0c0b` | Page background                |
| `grimoire-card`     | `#141210` | Cards, panels, sidebar         |
| `grimoire-hover`    | `#1c1916` | Hover states, subtle elevation |
| `grimoire-input`    | `#111009` | Input fields, textareas        |

### Borders

| Token               | Hex       | Usage                              |
| ------------------- | --------- | ---------------------------------- |
| `grimoire-border`   | `#2a2520` | Default borders                    |
| `grimoire-border-lg`| `#3a3530` | Emphasized borders, focused inputs |

### Text

| Token               | Hex       | Usage                     |
| ------------------- | --------- | ------------------------- |
| `grimoire-ink`      | `#f0ece4` | Primary text              |
| `grimoire-muted`    | `#6b6560` | Secondary / metadata text |
| `grimoire-faint`    | `#3a3530` | Disabled, placeholder     |

### Accent — Antique Gold

Used sparingly. One gold element per screen maximum.

| Token                  | Hex       | Usage                                   |
| ---------------------- | --------- | --------------------------------------- |
| `grimoire-gold`        | `#b8922a` | Active nav, selected tags, CTA buttons  |
| `grimoire-gold-dim`    | `#7a6020` | Muted gold — borders of selected items  |
| `grimoire-gold-bright` | `#d4aa40` | Hover state on gold elements            |

### Game Status

Muted and atmospheric — never bright saturated colors.

| Status      | Bg token                      | Text token                      |
| ----------- | ----------------------------- | --------------------------------|
| `PLAYING`   | `grimoire-status-playing-bg`  | `grimoire-status-playing-text`  |
| `BACKLOG`   | `grimoire-status-backlog-bg`  | `grimoire-status-backlog-text`  |
| `COMPLETED` | `grimoire-status-completed-bg`| `grimoire-status-completed-text`|
| `DROPPED`   | `grimoire-status-dropped-bg`  | `grimoire-status-dropped-text`  |
| `WISHLIST`  | `grimoire-status-wishlist-bg` | `grimoire-status-wishlist-text` |

---

## Typography

Two font roles. Never mix them up.

| Role        | Font        | Class           | Used for                                         |
| ----------- | ----------- | --------------- | ------------------------------------------------ |
| **Content** | Georgia     | `font-grimoire` | Game titles, page headings, AI responses         |
| **Chrome**  | System sans | `font-sans`     | Nav, badges, buttons, filters, metadata, numbers |

**Rule:** anything that is *content* gets `font-grimoire`. Anything that is *interface* stays `font-sans`.

```tsx
// Content — game title
<h3 className='font-grimoire text-base text-grimoire-ink'>{game.title}</h3>

// Content — page heading
<h1 className='font-grimoire text-xl text-grimoire-ink'>My Library</h1>

// Content — AI response (larger, generous line height)
<p className='font-grimoire text-base leading-loose text-grimoire-ink'>{streamedTokens}</p>

// Chrome — status badge
<span className='font-sans text-xs'>Playing</span>

// Chrome — filter button
<button className='font-sans text-xs'>Gothic / Victorian</button>
```

---

## Tailwind Config

Full `apps/web/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        grimoire: ['Georgia', '"Times New Roman"', 'serif'],
        sans: ['system-ui', 'sans-serif'],
      },
      colors: {
        grimoire: {
          deep:    '#0d0c0b',
          card:    '#141210',
          hover:   '#1c1916',
          input:   '#111009',
          border:  '#2a2520',
          'border-lg':     '#3a3530',
          ink:     '#f0ece4',
          muted:   '#6b6560',
          faint:   '#3a3530',
          gold:         '#b8922a',
          'gold-dim':   '#7a6020',
          'gold-bright':'#d4aa40',
          status: {
            'playing-bg':     '#1a2e20',
            'playing-text':   '#6ab882',
            'backlog-bg':     '#1c1916',
            'backlog-text':   '#6b6560',
            'completed-bg':   '#1a2030',
            'completed-text': '#6a92b8',
            'dropped-bg':     '#2e1a16',
            'dropped-text':   '#b87060',
            'wishlist-bg':    '#2a2010',
            'wishlist-text':  '#b8a060',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

---

## Project Structure (apps/web/src)

```
api/                     — All RTK Query API slices (flat)
  api.ts                 — RTK Query base API (createApi, baseQuery)
  adminApi.ts
  authApi.ts
  gamesApi.ts
  igdbApi.ts
  sessionsApi.ts
  steamApi.ts
  usersApi.ts

store/                   — Redux store and client-side slices
  store.ts               — Store setup
  hooks.ts               — useAppDispatch, useAppSelector
  aiSlice.ts
  filtersSlice.ts
  uiSlice.ts

components/              — Shared/reusable components (all cross-page UI)
  ui/                    — Shadcn primitives
    alert-dialog.tsx
    badge.tsx
    button.tsx
    card.tsx
    dialog.tsx
    input.tsx
    scroll-area.tsx
    select.tsx
    skeleton.tsx
    switch.tsx
    table.tsx
    tabs.tsx
    textarea.tsx
    toast.tsx
    toaster.tsx
    use-toast.ts
  AiPanel/
    AiPanel.tsx
    AiPanelContainer.tsx
  Layout/
    Layout.tsx
    Sidebar.tsx
  ProtectedRoute/
    AdminRoute.tsx
    MustChangePasswordRoute.tsx
    ProtectedRoute.tsx

hooks/                   — Shared custom hooks
  useAiStream.ts
  useDebounce.ts

utils/
  cn.ts

pages/                   — Route-level page components; each page owns its sub-components
  AdminDashboardPage/
    AdminDashboard.tsx
    AdminDashboardContainer.tsx
    AdminDashboardPage.tsx
    components/
      CreateUserDialog/
        CreateUserDialog.tsx
        CreateUserDialogContainer.tsx
      UserRow/
        UserRow.tsx
  AdminSetupPage/
    AdminSetupPage.tsx
  ChangePasswordPage/
    ChangePasswordPage.tsx
  GameDetailPage/
    GameDetailPage.tsx
    components/
      GameNotes/
        GameNotes.tsx
      LogSessionDialog.tsx
  LibraryPage/
    LibraryPage.tsx
    components/
      AddGameDialog/
        AddGameDialog.tsx
        AddGameDialogContainer.tsx
      FilterBar/
        FilterBar.tsx
      GameCard/
        GameCard.tsx
      GameGrid/
        GameGrid.tsx
        GameGridContainer.tsx
  LoginPage/
    LoginPage.tsx
  SettingsPage/
    SettingsPage.tsx
```

---

## Architecture: Container / Presentational Split

Every non-trivial UI feature is split into two layers. This boundary is mandatory.

### Decision Table

| Question                                        | Container   | Presentational |
| ----------------------------------------------- | ----------- | -------------- |
| Calls RTK Query hooks?                          | Yes         | **Never**      |
| Dispatches Redux actions for server state?      | Yes         | **Never**      |
| Owns UI-only state (`isOpen`, input value)?     | **Never**   | Yes            |
| Has Tailwind classes?                           | **Never**   | Yes            |
| Receives props from parent?                     | Rarely      | Always         |
| `useEffect` for data side-effects?              | Yes         | **Never**      |
| `useEffect` for DOM concerns (focus, scroll)?   | No          | Allowed        |
| File suffix                                     | `Container` | _(none)_       |

### File Placement

Shared/cross-page components live in `src/components/`:

```
components/
  AiPanel/
    AiPanel.tsx            ← presentational
    AiPanelContainer.tsx   ← container
```

Page-specific components live co-located under `pages/<PageName>/components/`:

```
pages/LibraryPage/
  LibraryPage.tsx
  components/
    GameCard/
      GameCard.tsx           ← no container needed
    GameGrid/
      GameGrid.tsx
      GameGridContainer.tsx
```

Single-responsibility presentational components with no container counterpart live directly in their `components/` folder without a subfolder.

### Container Example (minimal)

```tsx
// AiPanelContainer.tsx — data, dispatch, side effects. NO Tailwind. NO markup beyond a plain wrapper.
import { useAiStream } from '@/hooks/useAiStream';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMood, setSessionLength } from '@/store/aiSlice';

import { AiPanel } from './AiPanel';

function AiPanelContainer() {
  const dispatch = useAppDispatch();
  const { selectedMoods, sessionLengthMinutes, streamedTokens, isStreaming } =
    useAppSelector((s) => s.ai);
  const { streamRecommendation } = useAiStream();

  function handleMoodToggle(mood: string) {
    dispatch(toggleMood(mood));
  }

  function handleSessionLengthChange(minutes: number) {
    dispatch(setSessionLength(minutes));
  }

  return (
    <AiPanel
      selectedMoods={selectedMoods}
      sessionLengthMinutes={sessionLengthMinutes}
      streamedTokens={streamedTokens}
      isStreaming={isStreaming}
      onMoodToggle={handleMoodToggle}
      onSessionLengthChange={handleSessionLengthChange}
      onRequest={streamRecommendation}
    />
  );
}

export default AiPanelContainer;
```

### Presentational Example (minimal)

```tsx
// AiPanel.tsx — markup, Tailwind grimoire tokens, UI-only state. NO RTK Query. NO dispatch.
import { MOODS } from '@backlog-gg/shared';

import { cn } from '@/utils/cn';

interface IAiPanel {
  selectedMoods: string[];
  sessionLengthMinutes: number;
  streamedTokens: string;
  isStreaming: boolean;
  onMoodToggle: (mood: string) => void;
  onSessionLengthChange: (minutes: number) => void;
  onRequest: () => void;
}

function AiPanel({
  selectedMoods,
  sessionLengthMinutes,
  streamedTokens,
  isStreaming,
  onMoodToggle,
  onSessionLengthChange,
  onRequest,
}: IAiPanel) {
  const SESSION_OPTIONS = [60, 120, 240];

  return (
    <aside className='flex flex-col gap-4 p-4 border-l border-grimoire-border bg-grimoire-card w-64'>
      <div className='flex items-center justify-between'>
        <span className='font-grimoire text-sm text-grimoire-ink'>Tonight's pick</span>
        <span className='font-sans text-xs px-2 py-0.5 rounded-full bg-grimoire-gold/10 text-grimoire-gold border border-grimoire-gold-dim'>
          AI
        </span>
      </div>

      <div className='flex flex-col gap-2'>
        <p className='font-sans text-xs text-grimoire-muted'>How are you feeling?</p>
        <div className='flex flex-wrap gap-1.5'>
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => onMoodToggle(mood)}
              className={cn(
                'font-sans px-2.5 py-1 rounded-full text-xs border transition-colors',
                selectedMoods.includes(mood)
                  ? 'bg-grimoire-gold text-grimoire-deep border-grimoire-gold'
                  : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
              )}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      <div className='flex gap-1.5'>
        {SESSION_OPTIONS.map((min) => (
          <button
            key={min}
            onClick={() => onSessionLengthChange(min)}
            className={cn(
              'font-sans flex-1 py-1.5 text-xs rounded border transition-colors',
              sessionLengthMinutes === min
                ? 'bg-grimoire-gold text-grimoire-deep border-grimoire-gold'
                : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg',
            )}
          >
            {min < 60 ? `${min}m` : `${min / 60}h`}
          </button>
        ))}
      </div>

      {streamedTokens && (
        <p className='font-grimoire text-base leading-loose text-grimoire-ink'>
          {streamedTokens}
          {isStreaming && (
            <span className='inline-block w-px h-4 bg-grimoire-gold ml-0.5 animate-pulse' />
          )}
        </p>
      )}

      <button
        onClick={onRequest}
        disabled={isStreaming || selectedMoods.length === 0}
        className='font-sans w-full py-2 text-xs font-medium bg-grimoire-gold text-grimoire-deep rounded hover:bg-grimoire-gold-bright disabled:opacity-40 transition-colors'
      >
        {isStreaming ? 'Consulting the grimoire…' : 'Get recommendation'}
      </button>
    </aside>
  );
}

export default AiPanel;
```

---

## Code Style

### Import Order (strict — blank line between each group)

```ts
// 1. React
import React, { useState, useEffect, useRef } from 'react';

// 2. External libraries
import { ChevronDown } from 'lucide-react';

// 3. Internal aliases (@/)
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { GameStatus, GENRES } from '@backlog-gg/shared';

// 4. Local-folder (same feature/component)
import { GameCard } from './GameCard';
```

### Interface Convention

- Prefix: `I` + ComponentName (e.g. `IGameCard`)
- Order: required props → optional props → required handlers → optional handlers

```ts
interface IGameCard {
  id: string;
  title: string;
  status: GameStatus;
  playtimeHours: number;
  coverUrl?: string;
  onClick: (id: string) => void;
  onStatusChange?: (id: string, status: GameStatus) => void;
}
```

### Component Body Order (strict — omit unused sections, never reorder)

```
 1. Refs            — useRef
 2. Redux hooks     — useAppDispatch, useAppSelector
 3. RTK Query       — containers only
 4. Context         — useContext
 5. State           — useState
 6. Derived values  — computed constants, filtered arrays
 7. Effects         — useEffect / useLayoutEffect (named callback — see below)
 8. Event handlers  — functions named handleXxx
 9. Early returns   — guard clauses before main JSX
10. Main return     — shallow JSX, delegate to renderXxx helpers
11. Render helpers  — defined AFTER return, INSIDE the component
```

### useEffect: Named Callback Rule

```tsx
// CORRECT — named function
useEffect(
  function syncFiltersWithUrl() {
    const params = new URLSearchParams(location.search);
    dispatch(setStatusFilter(params.get('status') as GameStatus ?? null));
  },
  [location.search],
);

// WRONG — arrow function forbidden
useEffect(() => { /* ... */ }, [location.search]);
```

### Render Helper Rules

| Rule                 | Detail                                                             |
| -------------------- | ------------------------------------------------------------------ |
| Location             | After the `return`, inside the component function                  |
| Naming               | `renderXxx` camelCase — never `RenderXxx` or anonymous            |
| Parameters           | Accept arguments when they need external data                      |
| Conditional logic    | Lives inside the helper, not scattered inline in JSX               |
| Hooks                | **Never** call hooks inside render helpers                         |
| Extraction threshold | If a helper grows complex or reused → promote to its own component |

---

## Game Status Badge

Fixed mapping — never invent new status colors:

```ts
import { GameStatus } from '@backlog-gg/shared';

const STATUS_STYLES: Record<GameStatus, string> = {
  PLAYING:   'bg-grimoire-status-playing-bg   text-grimoire-status-playing-text',
  BACKLOG:   'bg-grimoire-status-backlog-bg   text-grimoire-status-backlog-text',
  COMPLETED: 'bg-grimoire-status-completed-bg text-grimoire-status-completed-text',
  DROPPED:   'bg-grimoire-status-dropped-bg   text-grimoire-status-dropped-text',
  WISHLIST:  'bg-grimoire-status-wishlist-bg  text-grimoire-status-wishlist-text',
}

// Usage
<span className={cn('font-sans text-xs px-2 py-0.5 rounded', STATUS_STYLES[game.status])}>
  {game.status}
</span>
```

---

## Shadcn Usage Rules

- Import from `@/components/ui/` — never directly from `@radix-ui`
- Run `npx shadcn@latest add <component>` to add primitives, commit the file
- Never modify Shadcn primitives directly — wrap and extend via `className` prop
- Override Shadcn default light-mode colors in `cn()` to match grimoire tokens
- Preferred: `Button`, `Badge`, `Card`, `Dialog`, `Select`, `Tabs`, `Sheet`, `ScrollArea`, `Skeleton`, `Toast`

---

## State Pattern: RTK Query → Slice → Selector

### Rule

Components never call RTK Query query hooks to read server state. All server-fetched data that is shared across the app (session, etc.) lives in a Redux slice. RTK Query acts purely as the transport mechanism. The three-step flow is:

1. **Dispatch the request** — RTK Query hook triggers the endpoint (query on mount, or mutation on user action)
2. **Write to the slice** — `onQueryStarted` in the API file intercepts the settled result and dispatches slice actions
3. **Read from the selector** — components call `useAppSelector((s) => s.sliceName.field)`, never the RTK Query hook

RTK Query hooks (`useXxxQuery`) may still be called in containers for local loading/error state that is not shared beyond that container. The selector is always the source of truth for shared data.

### When to apply this pattern

Apply the full slice pattern when the data is:
- Read by more than one unrelated component (e.g. `session` used in every route guard)
- The canonical source of truth for an entire domain (e.g. `auth.session`)

Do **not** apply this pattern for data that is only consumed by a single container, where RTK Query's internal cache is sufficient.

### Slice structure

```ts
// store/authSlice.ts
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { Session } from '@/api/authApi';

export interface AuthState {
  session: Session | null;
  isBootstrapped: boolean; // true once the first getSession settles
}

const initialState: AuthState = {
  session: null,
  isBootstrapped: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionLoaded: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      state.isBootstrapped = true;
    },
    sessionCleared: (state) => {
      state.session = null;
    },
  },
});

export const { sessionLoaded, sessionCleared } = authSlice.actions;
export default authSlice.reducer;
```

Key decisions:
- The type imported from the API file (`Session`) flows into the slice — the API file is the single definition point for that type
- `isBootstrapped` separates "not yet resolved" from "resolved but empty" — prevents redirect flicker on hard refresh
- No `extraReducers` — action creators live in the slice, not matched by string against RTK action types

### Wiring RTK Query to the slice via `onQueryStarted`

`onQueryStarted` lives inside the API file, right next to the endpoint definition. It dispatches the slice action after `queryFulfilled` resolves.

```ts
// api/authApi.ts
import { sessionCleared, sessionLoaded } from '@/store/authSlice';

getSession: builder.query<Session | null, void>({
  query: () => `${BASE_URL_PATH}/get-session`,
  providesTags: ['User'],
  onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
    try {
      const { data } = await queryFulfilled;
      dispatch(sessionLoaded(data));
    } catch {
      // Network error on boot — mark as bootstrapped with no session
      dispatch(sessionLoaded(null));
    }
  },
}),

signIn: builder.mutation<Session, SignInArgs>({
  query: (body) => ({ url: `${BASE_URL_PATH}/sign-in/email`, method: 'POST', body }),
  invalidatesTags: ['User'],
  onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
    const { data } = await queryFulfilled;
    dispatch(sessionLoaded(data));
    // No try/catch — let the mutation error propagate to the calling component
  },
}),

signOut: builder.mutation<void, void>({
  query: () => ({ url: `${BASE_URL_PATH}/sign-out`, method: 'POST' }),
  invalidatesTags: ['User', 'Game', 'Session', 'Stats'],
  onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
    await queryFulfilled;
    dispatch(sessionCleared());
  },
}),
```

Rules for `onQueryStarted`:
- Query endpoints: always wrap in try/catch — a network error on boot must still mark `isBootstrapped`
- Mutation endpoints: no try/catch — let the error surface to the caller via `.unwrap()` so it can show UI feedback
- Import slice actions via the `@/` alias — the API file is not a plain TS module and can reference store code
- Do not read from the store inside `onQueryStarted` — only dispatch

### Why `onQueryStarted` over `extraReducers + matchFulfilled`

`extraReducers + matchFulfilled` requires importing RTK Query action creators into the slice file, which creates a `store/ → api/` dependency. `onQueryStarted` keeps the coupling local to the API file where the endpoint is defined, leaving slices free of API imports. It also allows per-endpoint control (e.g. different error handling for queries vs mutations).

### Reading in components

```tsx
// Before — calls RTK Query, subscribes to its internal cache
const { data: session, isLoading } = useGetSessionQuery();

// After — reads from the authoritative slice
const { session, isBootstrapped } = useAppSelector((s) => s.auth);
```

The component never imports from `@/api/`. It only imports from `@/store/hooks`.

### Testing components that read from the slice

Do not mock RTK Query hooks. Provide a real store with preloaded state:

```tsx
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import { api } from '@/api/api';
import authReducer, { AuthState } from '@/store/authSlice';

function makeStore(auth: AuthState) {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      auth: authReducer,
    },
    preloadedState: { auth },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });
}

function renderWithStore(ui: React.ReactElement, auth: AuthState) {
  return render(<Provider store={makeStore(auth)}>{ui}</Provider>);
}
```

Only mock RTK Query hooks (e.g. `useSignInMutation`) when the component invokes them directly as mutation triggers — the mock replaces the trigger function, not the cached data.

---

## RTK Query Conventions

### File Layout

Every API file in `src/api/` follows this exact top-to-bottom order:

```ts
// 1. Shared package imports (types from @grimoire/shared)
import { Role } from '@grimoire/shared';

// 2. Base API — relative import, never @/
import { api } from './api';

// 3. All type definitions — export type, one per declaration
export type AdminUserRow = { ... }
export type AdminUserListResponse = { ... }
export type CreateUserArgs = { ... }

// 4. BASE_URL_PATH constant — immediately before injectEndpoints
const BASE_URL_PATH = 'admin';

// 5. Named api slice — assigned and exported
export const adminApi = api.injectEndpoints({ ... });

// 6. Hooks — destructured from the named slice and exported
export const {
  useListAdminUsersQuery,
  useCreateAdminUserMutation,
} = adminApi;
```

Rules:
- The import of `api` is always **relative** (`./api`), never via the `@/` alias
- There is no React import — API files are plain TypeScript, never `.tsx`
- `BASE_URL_PATH` is an untyped `const` string, not an enum and not a type

### Type Naming Conventions

| Pattern | Example | When to use |
| --- | --- | --- |
| `XxxRow` | `AdminUserRow` | Shape of a single item in a list response |
| `XxxListResponse` | `AdminUserListResponse` | Paginated/list wrapper (`{ data, total }`) |
| `CreateXxxArgs` | `CreateUserArgs` | Mutation input for POST creation |
| `UpdateXxxArgs` | `UpdateUserAiArgs`, `UpdateUserPlanArgs` | Mutation input for PATCH/PUT |
| `SetupXxxArgs` | `SetupAdminArgs` | One-time setup or special-case mutations |
| Plain noun | `AiGlobalSettings`, `AdminStats` | Config/settings shapes and complex response objects |

All types are exported individually with `export type`. Never group them in a namespace.

### Query vs Mutation Structure

Queries use string shorthand when there is no body:

```ts
listAdminUsers: builder.query<AdminUserListResponse, void>({
  query: () => `${BASE_URL_PATH}/users`,
  providesTags: ['AdminUser'],
}),
```

Mutations always use the object form:

```ts
createAdminUser: builder.mutation<AdminUserRow, CreateUserArgs>({
  query: (body) => ({ url: `${BASE_URL_PATH}/users`, method: 'POST', body }),
  invalidatesTags: ['AdminUser'],
}),
```

When the mutation args contain an `id` that belongs in the URL, destructure it inline — do not build a separate variable:

```ts
updateUserAiSettings: builder.mutation<void, UpdateUserAiArgs>({
  query: ({ id, ...body }) => ({ url: `${BASE_URL_PATH}/users/${id}/ai`, method: 'PATCH', body }),
  invalidatesTags: ['AdminUser'],
}),
```

When only specific fields go to the body (not a spread), pick them explicitly:

```ts
updateUserPlan: builder.mutation<AdminUserRow, UpdateUserPlanArgs>({
  query: ({ id, plan }) => ({ url: `${BASE_URL_PATH}/users/${id}/plan`, method: 'PATCH', body: { plan } }),
  invalidatesTags: ['AdminUser'],
}),
```

### Cache Tags

`providesTags` and `invalidatesTags` always take an array of string literals — never factory functions unless per-item invalidation is genuinely required:

```ts
providesTags: ['AdminUser']
invalidatesTags: ['AdminUser']
```

Cross-tag invalidation is allowed when a mutation affects multiple caches:

```ts
// Global AI toggle affects both admin view and user view
invalidatesTags: ['AdminUser', 'User'],
```

Omit tags entirely on endpoints where cache invalidation is not meaningful (e.g. one-time setup mutations):

```ts
setupAdmin: builder.mutation<AdminUserRow, SetupAdminArgs>({
  query: (body) => ({ url: `${BASE_URL_PATH}/setup`, method: 'POST', body }),
  // no invalidatesTags — one-time setup, no cache to bust
}),
```

Known tag types: `'Game' | 'Session' | 'User' | 'AdminUser' | 'Stats'`

### General Rules

- All endpoints in `src/api/<feature>Api.ts` via `api.injectEndpoints`
- Invalidate conservatively — only tags that actually changed
- Never call RTK Query hooks in presentational components

---

## Redux Slice Key Convention

Every slice file must export a named `const` for its Redux key. The const name is the slice name in `SCREAMING_SNAKE_CASE` with a `_SLICE` suffix. The string value is the exact key registered in `configureStore`.

### Rule

- Declare the const **before** the state interface, immediately after the last import
- Use the const in **both** `createSlice({ name })` and `configureStore({ reducer })`
- Never use an inline string literal in either place

### Slice file

```ts
// store/gamesSlice.ts

export const GAMES_SLICE = 'games';           // ← exported const

export interface GamesState { ... }

const gamesSlice = createSlice({
  name: GAMES_SLICE,                          // ← used here
  initialState,
  reducers: { ... },
});
```

### Store file

```ts
// store/store.ts
import gamesReducer, { GAMES_SLICE } from '@/store/gamesSlice';

export const store = configureStore({
  reducer: {
    [GAMES_SLICE]: gamesReducer,              // ← and here
  },
});
```

This makes the string a single source of truth — renaming a slice key is a one-line change in the slice file with no manual search across `store.ts`.

---

## Routing Convention

All route strings are defined in `apps/web/src/constants/routes.ts`. This file is the single source of truth — inline string literals like `'/login'` or `'/admin/dashboard'` are never used anywhere else in the codebase.

### Rules

1. **Every route string lives in `ROUTES`** — add a new key to `apps/web/src/constants/routes.ts` before using it anywhere.
2. **Import and use `ROUTES.XXX`** — in `<Route path=...>`, `<Navigate to=...>`, `<Link to=...>`, `navigate(...)`, and `location.pathname` comparisons.
3. **Parameterised URLs require a helper** — never build parameterised URLs with inline string interpolation. Export a dedicated helper from `routes.ts` and use it at every call site.

```ts
// apps/web/src/constants/routes.ts
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

// Helper for parameterised navigation — one function per parameterised route
export const getGameDetailsURL = (gameID: string) => ROUTES.GAME_DETAILS.replace(':id', gameID);
```

### Where each form is used

| Usage | Correct form | Example |
|---|---|---|
| React Router `<Route path=...>` | Raw `ROUTES.XXX` pattern | `<Route path={ROUTES.GAME_DETAILS} ...>` |
| `<Navigate to=...>` | Raw `ROUTES.XXX` pattern | `<Navigate to={ROUTES.LOGIN} replace />` |
| `<Link to=...>` static | Raw `ROUTES.XXX` | `<Link to={ROUTES.LIBRARY}>` |
| `<Link to=...>` with ID | Helper function | `<Link to={getGameDetailsURL(game.id)}>` |
| `navigate(...)` static | Raw `ROUTES.XXX` | `navigate(ROUTES.DEFAULT, { replace: true })` |
| `navigate(...)` with ID | Helper function | `navigate(getGameDetailsURL(id))` |
| `location.pathname` comparison | Raw `ROUTES.XXX` | `location.pathname !== ROUTES.CHANGE_PASSWORD` |

---

## Pre-Commit Checklist

Before finalizing any component, verify all of the following:

- [ ] No light mode — zero `dark:` prefixes anywhere
- [ ] All colors use `grimoire.*` tokens — zero raw Tailwind color scales
- [ ] Gold accent appears at most once per screen
- [ ] Mobile responsive (min breakpoint: 375px)
- [ ] Tailwind classes only — no inline styles
- [ ] File is under 400 lines
- [ ] Container has zero Tailwind classes
- [ ] Presentational has zero RTK Query hooks and zero Redux dispatch calls
- [ ] Content elements (game titles, headings, AI text) use `font-grimoire`
- [ ] Interface chrome (nav, buttons, badges, metadata) uses `font-sans`
- [ ] Component body sections are in the correct order (1–11)
- [ ] All `useEffect` callbacks use named functions, not arrows
- [ ] Imports follow the 4-group order with blank lines between groups
- [ ] Interface uses `I` prefix, props ordered correctly
- [ ] Shadcn primitives imported from `@/components/ui/`
- [ ] `cn()` used for conditional class merging — never string concatenation
- [ ] File ends with `export default ComponentName;` followed by a newline
- [ ] Every slice exports a named `SCREAMING_SNAKE_CASE_SLICE` const; `createSlice({ name })` and `configureStore({ reducer })` both use it — no inline string literals
- [ ] All route strings come from `ROUTES.XXX` imported from `@/constants/routes` — no inline `'/login'`, `'/'`, etc.
- [ ] Parameterised navigation uses a helper from `routes.ts` (e.g. `getGameDetailsURL(id)`) — never inline string interpolation
- [ ] `<Route path=...>` uses the raw `ROUTES.XXX` pattern constant — helpers are only for building actual navigation URLs
