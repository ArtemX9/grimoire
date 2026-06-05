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

export const sessionsGetRecentPending = () => ({ type: SESSIONS_GET_RECENT_PENDING, payload: {} });
export const sessionsGetRecentFulfilled = (sessions: PlaySession[]) => ({ type: SESSIONS_GET_RECENT_FULFILLED, payload: { sessions } });
export const sessionsGetRecentRejected = (error: string) => ({ type: SESSIONS_GET_RECENT_REJECTED, payload: { error } });

export const sessionsGetForGamePending = () => ({ type: SESSIONS_GET_FOR_GAME_PENDING, payload: {} });
export const sessionsGetForGameFulfilled = (gameId: string, sessions: PlaySession[]) =>
  ({ type: SESSIONS_GET_FOR_GAME_FULFILLED, payload: { gameId, sessions } });
export const sessionsGetForGameRejected = (error: string) => ({ type: SESSIONS_GET_FOR_GAME_REJECTED, payload: { error } });

export const sessionsCreatePending = () => ({ type: SESSIONS_CREATE_PENDING, payload: {} });
export const sessionsCreateFulfilled = (session: PlaySession) => ({ type: SESSIONS_CREATE_FULFILLED, payload: { session } });
export const sessionsCreateRejected = (error: string) => ({ type: SESSIONS_CREATE_REJECTED, payload: { error } });

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
