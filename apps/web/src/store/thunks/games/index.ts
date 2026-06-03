import { UserGame } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import {
  gamesCreateFulfilled,
  gamesCreatePending,
  gamesCreateRejected,
  gamesDeleteFulfilled,
  gamesDeletePending,
  gamesDeleteRejected,
  gamesGetAllFulfilled,
  gamesGetAllPending,
  gamesGetAllRejected,
  gamesGetOneFulfilled,
  gamesGetOnePending,
  gamesGetOneRejected,
  gamesGetStatsFulfilled,
  gamesGetStatsPending,
  gamesGetStatsRejected,
  gamesRemapFulfilled,
  gamesRemapPending,
  gamesRemapRejected,
  gamesUpdateFulfilled,
  gamesUpdatePending,
  gamesUpdateRejected,
} from '@/store/actions/games';
import type { AppThunk } from '@/store/store';

import type { CreateGameArgs, GameStats, GamesQuery, RemapGameArgs, UpdateGameArgs } from './types';

function buildGamesUrl(params: GamesQuery = {}): string {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (filtered.length === 0) return '/games';
  const qs = new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
  return `/games?${qs}`;
}

// ---------------------------------------------------------------------------
// getGames
// ---------------------------------------------------------------------------

export const getGames =
  (params?: GamesQuery): AppThunk<Promise<UserGame[]>> =>
  async (dispatch) => {
    dispatch(gamesGetAllPending());
    try {
      const data = await apiFetch<UserGame[]>(buildGamesUrl(params));
      dispatch(gamesGetAllFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(gamesGetAllRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// getGame
// ---------------------------------------------------------------------------

export const getGame =
  (id: string): AppThunk<Promise<UserGame>> =>
  async (dispatch) => {
    dispatch(gamesGetOnePending());
    try {
      const data = await apiFetch<UserGame>(`/games/${id}`);
      dispatch(gamesGetOneFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(gamesGetOneRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// getGameStats
// ---------------------------------------------------------------------------

export const getGameStats = (): AppThunk<Promise<GameStats>> => async (dispatch) => {
  dispatch(gamesGetStatsPending());
  try {
    const data = await apiFetch<GameStats>('/games/stats');
    dispatch(gamesGetStatsFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(gamesGetStatsRejected(message));
    throw new Error(message);
  }
};

// ---------------------------------------------------------------------------
// createGame
// ---------------------------------------------------------------------------

export const createGame =
  (body: CreateGameArgs): AppThunk<Promise<UserGame>> =>
  async (dispatch) => {
    dispatch(gamesCreatePending());
    try {
      const data = await apiFetch<UserGame>('/games', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      dispatch(gamesCreateFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(gamesCreateRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// updateGame
// ---------------------------------------------------------------------------

export const updateGame =
  ({ id, data }: UpdateGameArgs): AppThunk<Promise<UserGame>> =>
  async (dispatch) => {
    dispatch(gamesUpdatePending());
    try {
      const updated = await apiFetch<UserGame>(`/games/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      dispatch(gamesUpdateFulfilled(updated));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(gamesUpdateRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// remapGame
// ---------------------------------------------------------------------------

export const remapGame =
  ({ id, data }: RemapGameArgs): AppThunk<Promise<UserGame>> =>
  async (dispatch) => {
    dispatch(gamesRemapPending());
    try {
      const updated = await apiFetch<UserGame>(`/games/${id}/remap`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      dispatch(gamesRemapFulfilled(updated));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(gamesRemapRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// deleteGame
// ---------------------------------------------------------------------------

export const deleteGame =
  (id: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    dispatch(gamesDeletePending());
    try {
      await apiFetch<void>(`/games/${id}`, { method: 'DELETE' });
      dispatch(gamesDeleteFulfilled(id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(gamesDeleteRejected(message));
      throw new Error(message);
    }
  };
