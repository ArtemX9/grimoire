import { UnmappedGame } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import {
  unmappedGamesDeleteFulfilled,
  unmappedGamesDeletePending,
  unmappedGamesDeleteRejected,
  unmappedGamesGetAllFulfilled,
  unmappedGamesGetAllPending,
  unmappedGamesGetAllRejected,
  unmappedGamesMapFulfilled,
  unmappedGamesMapPending,
  unmappedGamesMapRejected,
} from '@/store/actions/unmappedGames';
import type { AppThunk } from '@/store/store';

import type { GetUnmappedGamesArgs, MapUnmappedGameArgs } from './types';

// ---------------------------------------------------------------------------
// getUnmappedGames
// ---------------------------------------------------------------------------

export const getUnmappedGames =
  (params: GetUnmappedGamesArgs = {}): AppThunk<Promise<UnmappedGame[]>> =>
  async (dispatch) => {
    dispatch(unmappedGamesGetAllPending());
    try {
      const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
      const qs = filtered.length > 0 ? '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString() : '';
      const data = await apiFetch<UnmappedGame[]>(`/unmapped-games${qs}`);
      dispatch(unmappedGamesGetAllFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(unmappedGamesGetAllRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// mapUnmappedGame
// ---------------------------------------------------------------------------

export const mapUnmappedGame =
  ({ id, body }: MapUnmappedGameArgs): AppThunk<Promise<void>> =>
  async (dispatch) => {
    dispatch(unmappedGamesMapPending());
    try {
      await apiFetch<void>(`/unmapped-games/map/${id}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      dispatch(unmappedGamesMapFulfilled({ id, body }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(unmappedGamesMapRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// deleteUnmappedGame
// ---------------------------------------------------------------------------

export const deleteUnmappedGame =
  (id: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    dispatch(unmappedGamesDeletePending());
    try {
      await apiFetch<void>(`/unmapped-games/${id}`, { method: 'DELETE' });
      dispatch(unmappedGamesDeleteFulfilled(id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(unmappedGamesDeleteRejected(message));
      throw new Error(message);
    }
  };
