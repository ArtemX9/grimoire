import { UnmappedGame } from '@grimoire/shared';

import type { MapUnmappedGameArgs } from '@/store/thunks/unmappedGames/types';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const UNMAPPED_GAMES_GET_ALL_PENDING = 'unmappedGames/getAll/pending';
export const UNMAPPED_GAMES_GET_ALL_FULFILLED = 'unmappedGames/getAll/fulfilled';
export const UNMAPPED_GAMES_GET_ALL_REJECTED = 'unmappedGames/getAll/rejected';

export const UNMAPPED_GAMES_MAP_PENDING = 'unmappedGames/map/pending';
export const UNMAPPED_GAMES_MAP_FULFILLED = 'unmappedGames/map/fulfilled';
export const UNMAPPED_GAMES_MAP_REJECTED = 'unmappedGames/map/rejected';

export const UNMAPPED_GAMES_DELETE_PENDING = 'unmappedGames/delete/pending';
export const UNMAPPED_GAMES_DELETE_FULFILLED = 'unmappedGames/delete/fulfilled';
export const UNMAPPED_GAMES_DELETE_REJECTED = 'unmappedGames/delete/rejected';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const unmappedGamesGetAllPending = () => ({ type: UNMAPPED_GAMES_GET_ALL_PENDING }) as const;
export const unmappedGamesGetAllFulfilled = (payload: UnmappedGame[]) => ({ type: UNMAPPED_GAMES_GET_ALL_FULFILLED, payload }) as const;
export const unmappedGamesGetAllRejected = (error: string) => ({ type: UNMAPPED_GAMES_GET_ALL_REJECTED, error }) as const;

export const unmappedGamesMapPending = () => ({ type: UNMAPPED_GAMES_MAP_PENDING }) as const;
export const unmappedGamesMapFulfilled = (arg: MapUnmappedGameArgs) => ({ type: UNMAPPED_GAMES_MAP_FULFILLED, meta: { arg } }) as const;
export const unmappedGamesMapRejected = (error: string) => ({ type: UNMAPPED_GAMES_MAP_REJECTED, error }) as const;

export const unmappedGamesDeletePending = () => ({ type: UNMAPPED_GAMES_DELETE_PENDING }) as const;
export const unmappedGamesDeleteFulfilled = (id: string) => ({ type: UNMAPPED_GAMES_DELETE_FULFILLED, meta: { arg: id } }) as const;
export const unmappedGamesDeleteRejected = (error: string) => ({ type: UNMAPPED_GAMES_DELETE_REJECTED, error }) as const;

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type UnmappedGamesAction =
  | ReturnType<typeof unmappedGamesGetAllPending>
  | ReturnType<typeof unmappedGamesGetAllFulfilled>
  | ReturnType<typeof unmappedGamesGetAllRejected>
  | ReturnType<typeof unmappedGamesMapPending>
  | ReturnType<typeof unmappedGamesMapFulfilled>
  | ReturnType<typeof unmappedGamesMapRejected>
  | ReturnType<typeof unmappedGamesDeletePending>
  | ReturnType<typeof unmappedGamesDeleteFulfilled>
  | ReturnType<typeof unmappedGamesDeleteRejected>;
