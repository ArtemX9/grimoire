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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unmappedGamesReducer(state = initialState, rawAction: any): UnmappedGamesState {
  const action = rawAction as UnmappedGamesAction;
  switch (action.type) {
    // getUnmappedGames
    case UNMAPPED_GAMES_GET_ALL_PENDING:
      return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
    case UNMAPPED_GAMES_GET_ALL_FULFILLED:
      return { ...state, fetchStatus: AsyncStatus.Succeeded, games: action.payload };
    case UNMAPPED_GAMES_GET_ALL_REJECTED:
      return { ...state, fetchStatus: AsyncStatus.Failed, error: action.error };

    // mapUnmappedGame
    case UNMAPPED_GAMES_MAP_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
    case UNMAPPED_GAMES_MAP_FULFILLED:
      return {
        ...state,
        mutationStatus: AsyncStatus.Succeeded,
        games: state.games.filter((g) => g.id !== action.meta.arg.id),
      };
    case UNMAPPED_GAMES_MAP_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    // deleteUnmappedGame
    case UNMAPPED_GAMES_DELETE_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
    case UNMAPPED_GAMES_DELETE_FULFILLED:
      return {
        ...state,
        mutationStatus: AsyncStatus.Succeeded,
        games: state.games.filter((g) => g.id !== action.meta.arg),
      };
    case UNMAPPED_GAMES_DELETE_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    default:
      return state;
  }
}

export default unmappedGamesReducer;
