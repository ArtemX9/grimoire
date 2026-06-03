import { IgdbGame } from '@grimoire/shared';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const IGDB_SEARCH_PENDING = 'igdb/search/pending';
export const IGDB_SEARCH_FULFILLED = 'igdb/search/fulfilled';
export const IGDB_SEARCH_REJECTED = 'igdb/search/rejected';

export const IGDB_GET_GAME_PENDING = 'igdb/getGame/pending';
export const IGDB_GET_GAME_FULFILLED = 'igdb/getGame/fulfilled';
export const IGDB_GET_GAME_REJECTED = 'igdb/getGame/rejected';

export const IGDB_CLEAR_SEARCH_RESULTS = 'igdb/CLEAR_SEARCH_RESULTS';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const igdbSearchPending = () => ({ type: IGDB_SEARCH_PENDING }) as const;
export const igdbSearchFulfilled = (payload: IgdbGame[]) => ({ type: IGDB_SEARCH_FULFILLED, payload }) as const;
export const igdbSearchRejected = (error: string) => ({ type: IGDB_SEARCH_REJECTED, error }) as const;

export const igdbGetGamePending = () => ({ type: IGDB_GET_GAME_PENDING }) as const;
export const igdbGetGameFulfilled = (payload: IgdbGame) => ({ type: IGDB_GET_GAME_FULFILLED, payload }) as const;
export const igdbGetGameRejected = (error: string) => ({ type: IGDB_GET_GAME_REJECTED, error }) as const;

export const clearSearchResults = () => ({ type: IGDB_CLEAR_SEARCH_RESULTS }) as const;

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type IgdbAction =
  | ReturnType<typeof igdbSearchPending>
  | ReturnType<typeof igdbSearchFulfilled>
  | ReturnType<typeof igdbSearchRejected>
  | ReturnType<typeof igdbGetGamePending>
  | ReturnType<typeof igdbGetGameFulfilled>
  | ReturnType<typeof igdbGetGameRejected>
  | ReturnType<typeof clearSearchResults>;
