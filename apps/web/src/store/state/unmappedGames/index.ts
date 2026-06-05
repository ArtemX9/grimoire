import { AsyncStatus, UnmappedGame } from '@grimoire/shared';

import {
  UNMAPPED_GAMES_DELETE_FULFILLED,
  UNMAPPED_GAMES_DELETE_PENDING,
  UNMAPPED_GAMES_DELETE_REJECTED,
  UNMAPPED_GAMES_GET_ALL_FULFILLED,
  UNMAPPED_GAMES_GET_ALL_PENDING,
  UNMAPPED_GAMES_GET_ALL_REJECTED,
  UNMAPPED_GAMES_MAP_FULFILLED,
  UNMAPPED_GAMES_MAP_PENDING,
  UNMAPPED_GAMES_MAP_REJECTED,
  type UnmappedGamesAction,
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

export const UNMAPPED_GAMES_SLICE = 'unmappedGames';

export interface UnmappedGamesState {
  games: UnmappedGame[];
  fetchStatus: AsyncStatus;
  mutationStatus: AsyncStatus;
  error: string | null;
}

const initialState: UnmappedGamesState = {
  games: [],
  fetchStatus: AsyncStatus.Idle,
  mutationStatus: AsyncStatus.Idle,
  error: null,
};

export function unmappedGamesReducer(state = initialState, action: UnmappedGamesAction): UnmappedGamesState {
  switch (action.type) {
    // getUnmappedGames
    case UNMAPPED_GAMES_GET_ALL_PENDING:
      return handleUnmappedGamesGetAllStart(state, action as ReturnType<typeof unmappedGamesGetAllPending>);
    case UNMAPPED_GAMES_GET_ALL_FULFILLED:
      return handleUnmappedGamesGetAllSuccess(state, action as ReturnType<typeof unmappedGamesGetAllFulfilled>);
    case UNMAPPED_GAMES_GET_ALL_REJECTED:
      return handleUnmappedGamesGetAllFailure(state, action as ReturnType<typeof unmappedGamesGetAllRejected>);

    // mapUnmappedGame
    case UNMAPPED_GAMES_MAP_PENDING:
      return handleUnmappedGamesMapStart(state, action as ReturnType<typeof unmappedGamesMapPending>);
    case UNMAPPED_GAMES_MAP_FULFILLED:
      return handleUnmappedGamesMapSuccess(state, action as ReturnType<typeof unmappedGamesMapFulfilled>);
    case UNMAPPED_GAMES_MAP_REJECTED:
      return handleUnmappedGamesMapFailure(state, action as ReturnType<typeof unmappedGamesMapRejected>);

    // deleteUnmappedGame
    case UNMAPPED_GAMES_DELETE_PENDING:
      return handleUnmappedGamesDeleteStart(state, action as ReturnType<typeof unmappedGamesDeletePending>);
    case UNMAPPED_GAMES_DELETE_FULFILLED:
      return handleUnmappedGamesDeleteSuccess(state, action as ReturnType<typeof unmappedGamesDeleteFulfilled>);
    case UNMAPPED_GAMES_DELETE_REJECTED:
      return handleUnmappedGamesDeleteFailure(state, action as ReturnType<typeof unmappedGamesDeleteRejected>);

    default:
      return state;
  }
}

// getUnmappedGames
function handleUnmappedGamesGetAllStart(state: UnmappedGamesState, _action: ReturnType<typeof unmappedGamesGetAllPending>): UnmappedGamesState {
  return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
}
function handleUnmappedGamesGetAllSuccess(state: UnmappedGamesState, action: ReturnType<typeof unmappedGamesGetAllFulfilled>): UnmappedGamesState {
  return { ...state, fetchStatus: AsyncStatus.Succeeded, games: action.payload.games };
}
function handleUnmappedGamesGetAllFailure(state: UnmappedGamesState, action: ReturnType<typeof unmappedGamesGetAllRejected>): UnmappedGamesState {
  return { ...state, fetchStatus: AsyncStatus.Failed, error: action.payload.error };
}

// mapUnmappedGame
function handleUnmappedGamesMapStart(state: UnmappedGamesState, _action: ReturnType<typeof unmappedGamesMapPending>): UnmappedGamesState {
  return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
}
function handleUnmappedGamesMapSuccess(state: UnmappedGamesState, action: ReturnType<typeof unmappedGamesMapFulfilled>): UnmappedGamesState {
  return {
    ...state,
    mutationStatus: AsyncStatus.Succeeded,
    games: state.games.filter((g) => g.id !== action.payload.args.id),
  };
}
function handleUnmappedGamesMapFailure(state: UnmappedGamesState, action: ReturnType<typeof unmappedGamesMapRejected>): UnmappedGamesState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

// deleteUnmappedGame
function handleUnmappedGamesDeleteStart(state: UnmappedGamesState, _action: ReturnType<typeof unmappedGamesDeletePending>): UnmappedGamesState {
  return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
}
function handleUnmappedGamesDeleteSuccess(state: UnmappedGamesState, action: ReturnType<typeof unmappedGamesDeleteFulfilled>): UnmappedGamesState {
  return {
    ...state,
    mutationStatus: AsyncStatus.Succeeded,
    games: state.games.filter((g) => g.id !== action.payload.id),
  };
}
function handleUnmappedGamesDeleteFailure(state: UnmappedGamesState, action: ReturnType<typeof unmappedGamesDeleteRejected>): UnmappedGamesState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

export default unmappedGamesReducer;
