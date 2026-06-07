import { IgdbGame } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import {
  igdbGetGameFulfilled,
  igdbGetGamePending,
  igdbGetGameRejected,
  igdbSearchFulfilled,
  igdbSearchPending,
  igdbSearchRejected,
} from '@/store/actions/igdb';
import type { AppThunk } from '@/store/store';

import type { GetIgdbGameArgs, SearchIgdbArgs } from './types';

// ---------------------------------------------------------------------------
// searchIgdb
// ---------------------------------------------------------------------------

export const searchIgdb =
  ({ query }: SearchIgdbArgs): AppThunk =>
  async (dispatch) => {
    dispatch(igdbSearchPending());
    try {
      const data = await apiFetch<IgdbGame[]>(`/igdb/search?q=${encodeURIComponent(query)}`);
      dispatch(igdbSearchFulfilled(data));
    } catch (err) {
      dispatch(igdbSearchRejected(err instanceof Error ? err.message : 'Unknown error'));
    }
  };

// ---------------------------------------------------------------------------
// getIgdbGame
// ---------------------------------------------------------------------------

export const getIgdbGame =
  ({ igdbID }: GetIgdbGameArgs): AppThunk =>
  async (dispatch) => {
    dispatch(igdbGetGamePending());
    try {
      const data = await apiFetch<IgdbGame>(`/igdb/${igdbID}`);
      dispatch(igdbGetGameFulfilled(data));
    } catch (err) {
      dispatch(igdbGetGameRejected(err instanceof Error ? err.message : 'Unknown error'));
    }
  };
