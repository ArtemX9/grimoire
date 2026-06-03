import { PlaySession } from '@grimoire/shared';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const SESSIONS_GET_RECENT_PENDING = 'sessions/getRecent/pending';
export const SESSIONS_GET_RECENT_FULFILLED = 'sessions/getRecent/fulfilled';
export const SESSIONS_GET_RECENT_REJECTED = 'sessions/getRecent/rejected';

export const SESSIONS_GET_FOR_GAME_PENDING = 'sessions/getForGame/pending';
export const SESSIONS_GET_FOR_GAME_FULFILLED = 'sessions/getForGame/fulfilled';
export const SESSIONS_GET_FOR_GAME_REJECTED = 'sessions/getForGame/rejected';

export const SESSIONS_CREATE_PENDING = 'sessions/create/pending';
export const SESSIONS_CREATE_FULFILLED = 'sessions/create/fulfilled';
export const SESSIONS_CREATE_REJECTED = 'sessions/create/rejected';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const sessionsGetRecentPending = () => ({ type: SESSIONS_GET_RECENT_PENDING }) as const;
export const sessionsGetRecentFulfilled = (payload: PlaySession[]) => ({ type: SESSIONS_GET_RECENT_FULFILLED, payload }) as const;
export const sessionsGetRecentRejected = (error: string) => ({ type: SESSIONS_GET_RECENT_REJECTED, error }) as const;

export const sessionsGetForGamePending = () => ({ type: SESSIONS_GET_FOR_GAME_PENDING }) as const;
export const sessionsGetForGameFulfilled = (gameId: string, payload: PlaySession[]) =>
  ({ type: SESSIONS_GET_FOR_GAME_FULFILLED, meta: { arg: { gameId } }, payload }) as const;
export const sessionsGetForGameRejected = (error: string) => ({ type: SESSIONS_GET_FOR_GAME_REJECTED, error }) as const;

export const sessionsCreatePending = () => ({ type: SESSIONS_CREATE_PENDING }) as const;
export const sessionsCreateFulfilled = (payload: PlaySession) => ({ type: SESSIONS_CREATE_FULFILLED, payload }) as const;
export const sessionsCreateRejected = (error: string) => ({ type: SESSIONS_CREATE_REJECTED, error }) as const;

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type SessionsAction =
  | ReturnType<typeof sessionsGetRecentPending>
  | ReturnType<typeof sessionsGetRecentFulfilled>
  | ReturnType<typeof sessionsGetRecentRejected>
  | ReturnType<typeof sessionsGetForGamePending>
  | ReturnType<typeof sessionsGetForGameFulfilled>
  | ReturnType<typeof sessionsGetForGameRejected>
  | ReturnType<typeof sessionsCreatePending>
  | ReturnType<typeof sessionsCreateFulfilled>
  | ReturnType<typeof sessionsCreateRejected>;
