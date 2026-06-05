import { UserGame } from '@grimoire/shared';

import type { GameStats } from '@/store/thunks/games/types';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const GAMES_GET_ALL_PENDING = 'games/getAll/pending';
export const GAMES_GET_ALL_FULFILLED = 'games/getAll/fulfilled';
export const GAMES_GET_ALL_REJECTED = 'games/getAll/rejected';

export const GAMES_GET_ONE_PENDING = 'games/getOne/pending';
export const GAMES_GET_ONE_FULFILLED = 'games/getOne/fulfilled';
export const GAMES_GET_ONE_REJECTED = 'games/getOne/rejected';

export const GAMES_GET_STATS_PENDING = 'games/getStats/pending';
export const GAMES_GET_STATS_FULFILLED = 'games/getStats/fulfilled';
export const GAMES_GET_STATS_REJECTED = 'games/getStats/rejected';

export const GAMES_CREATE_PENDING = 'games/create/pending';
export const GAMES_CREATE_FULFILLED = 'games/create/fulfilled';
export const GAMES_CREATE_REJECTED = 'games/create/rejected';

export const GAMES_UPDATE_PENDING = 'games/update/pending';
export const GAMES_UPDATE_FULFILLED = 'games/update/fulfilled';
export const GAMES_UPDATE_REJECTED = 'games/update/rejected';

export const GAMES_REMAP_PENDING = 'games/remap/pending';
export const GAMES_REMAP_FULFILLED = 'games/remap/fulfilled';
export const GAMES_REMAP_REJECTED = 'games/remap/rejected';

export const GAMES_DELETE_PENDING = 'games/delete/pending';
export const GAMES_DELETE_FULFILLED = 'games/delete/fulfilled';
export const GAMES_DELETE_REJECTED = 'games/delete/rejected';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const gamesGetAllPending = () => ({ type: GAMES_GET_ALL_PENDING, payload: {} });
export const gamesGetAllFulfilled = (games: UserGame[]) => ({ type: GAMES_GET_ALL_FULFILLED, payload: { games } });
export const gamesGetAllRejected = (error: string) => ({ type: GAMES_GET_ALL_REJECTED, payload: { error } });

export const gamesGetOnePending = () => ({ type: GAMES_GET_ONE_PENDING, payload: {} });
export const gamesGetOneFulfilled = (game: UserGame) => ({ type: GAMES_GET_ONE_FULFILLED, payload: { game } });
export const gamesGetOneRejected = (error: string) => ({ type: GAMES_GET_ONE_REJECTED, payload: { error } });

export const gamesGetStatsPending = () => ({ type: GAMES_GET_STATS_PENDING, payload: {} });
export const gamesGetStatsFulfilled = (stats: GameStats) => ({ type: GAMES_GET_STATS_FULFILLED, payload: { stats } });
export const gamesGetStatsRejected = (error: string) => ({ type: GAMES_GET_STATS_REJECTED, payload: { error } });

export const gamesCreatePending = () => ({ type: GAMES_CREATE_PENDING, payload: {} });
export const gamesCreateFulfilled = (game: UserGame) => ({ type: GAMES_CREATE_FULFILLED, payload: { game } });
export const gamesCreateRejected = (error: string) => ({ type: GAMES_CREATE_REJECTED, payload: { error } });

export const gamesUpdatePending = () => ({ type: GAMES_UPDATE_PENDING, payload: {} });
export const gamesUpdateFulfilled = (game: UserGame) => ({ type: GAMES_UPDATE_FULFILLED, payload: { game } });
export const gamesUpdateRejected = (error: string) => ({ type: GAMES_UPDATE_REJECTED, payload: { error } });

export const gamesRemapPending = () => ({ type: GAMES_REMAP_PENDING, payload: {} });
export const gamesRemapFulfilled = (game: UserGame) => ({ type: GAMES_REMAP_FULFILLED, payload: { game } });
export const gamesRemapRejected = (error: string) => ({ type: GAMES_REMAP_REJECTED, payload: { error } });

export const gamesDeletePending = () => ({ type: GAMES_DELETE_PENDING, payload: {} });
export const gamesDeleteFulfilled = (id: string) => ({ type: GAMES_DELETE_FULFILLED, payload: { id } });
export const gamesDeleteRejected = (error: string) => ({ type: GAMES_DELETE_REJECTED, payload: { error } });

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type GamesAction =
  | ReturnType<typeof gamesGetAllPending>
  | ReturnType<typeof gamesGetAllFulfilled>
  | ReturnType<typeof gamesGetAllRejected>
  | ReturnType<typeof gamesGetOnePending>
  | ReturnType<typeof gamesGetOneFulfilled>
  | ReturnType<typeof gamesGetOneRejected>
  | ReturnType<typeof gamesGetStatsPending>
  | ReturnType<typeof gamesGetStatsFulfilled>
  | ReturnType<typeof gamesGetStatsRejected>
  | ReturnType<typeof gamesCreatePending>
  | ReturnType<typeof gamesCreateFulfilled>
  | ReturnType<typeof gamesCreateRejected>
  | ReturnType<typeof gamesUpdatePending>
  | ReturnType<typeof gamesUpdateFulfilled>
  | ReturnType<typeof gamesUpdateRejected>
  | ReturnType<typeof gamesRemapPending>
  | ReturnType<typeof gamesRemapFulfilled>
  | ReturnType<typeof gamesRemapRejected>
  | ReturnType<typeof gamesDeletePending>
  | ReturnType<typeof gamesDeleteFulfilled>
  | ReturnType<typeof gamesDeleteRejected>;
