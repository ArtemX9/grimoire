import { PlaySession } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import {
  sessionsCreateFulfilled,
  sessionsCreatePending,
  sessionsCreateRejected,
  sessionsGetForGameFulfilled,
  sessionsGetForGamePending,
  sessionsGetForGameRejected,
  sessionsGetRecentFulfilled,
  sessionsGetRecentPending,
  sessionsGetRecentRejected,
} from '@/store/actions/sessions';
import type { AppThunk } from '@/store/store';

import type { CreateSessionArgs, GetGameSessionsArgs, GetRecentSessionsArgs } from './types';

// ---------------------------------------------------------------------------
// getRecentSessions
// ---------------------------------------------------------------------------

export const getRecentSessions =
  ({ limit = 10 }: GetRecentSessionsArgs = {}): AppThunk<Promise<PlaySession[]>> =>
  async (dispatch) => {
    dispatch(sessionsGetRecentPending());
    try {
      const data = await apiFetch<PlaySession[]>(`/sessions/recent?limit=${limit}`);
      dispatch(sessionsGetRecentFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(sessionsGetRecentRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// getGameSessions
// ---------------------------------------------------------------------------

export const getGameSessions =
  ({ gameId }: GetGameSessionsArgs): AppThunk<Promise<PlaySession[]>> =>
  async (dispatch) => {
    dispatch(sessionsGetForGamePending());
    try {
      const data = await apiFetch<PlaySession[]>(`/sessions/game/${gameId}`);
      dispatch(sessionsGetForGameFulfilled(gameId, data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(sessionsGetForGameRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

export const createSession =
  (body: CreateSessionArgs): AppThunk<Promise<PlaySession>> =>
  async (dispatch) => {
    dispatch(sessionsCreatePending());
    try {
      const data = await apiFetch<PlaySession>('/sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      dispatch(sessionsCreateFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(sessionsCreateRejected(message));
      throw new Error(message);
    }
  };
