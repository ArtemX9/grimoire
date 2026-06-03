import { AsyncStatus, UserGame } from '@grimoire/shared';

import {
  GAMES_CREATE_FULFILLED,
  GAMES_CREATE_PENDING,
  GAMES_CREATE_REJECTED,
  GAMES_DELETE_FULFILLED,
  GAMES_DELETE_PENDING,
  GAMES_DELETE_REJECTED,
  GAMES_GET_ALL_FULFILLED,
  GAMES_GET_ALL_PENDING,
  GAMES_GET_ALL_REJECTED,
  GAMES_GET_ONE_FULFILLED,
  GAMES_GET_ONE_PENDING,
  GAMES_GET_ONE_REJECTED,
  GAMES_GET_STATS_FULFILLED,
  GAMES_GET_STATS_PENDING,
  GAMES_GET_STATS_REJECTED,
  GAMES_REMAP_FULFILLED,
  GAMES_REMAP_PENDING,
  GAMES_REMAP_REJECTED,
  GAMES_UPDATE_FULFILLED,
  GAMES_UPDATE_PENDING,
  GAMES_UPDATE_REJECTED,
  type GamesAction,
} from '@/store/actions/games';
import type { GameStats } from '@/store/thunks/games/types';

export { type GameStats } from '@/store/thunks/games/types';

export const GAMES_SLICE = 'games';

export interface GamesState {
  games: UserGame[];
  selectedGame: UserGame | null;
  stats: GameStats | null;
  gamesStatus: AsyncStatus;
  selectedGameStatus: AsyncStatus;
  statsStatus: AsyncStatus;
  mutationStatus: AsyncStatus;
  error: string | null;
}

const initialState: GamesState = {
  games: [],
  selectedGame: null,
  stats: null,
  gamesStatus: AsyncStatus.Idle,
  selectedGameStatus: AsyncStatus.Idle,
  statsStatus: AsyncStatus.Idle,
  mutationStatus: AsyncStatus.Idle,
  error: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function gamesReducer(state = initialState, rawAction: any): GamesState {
  const action = rawAction as GamesAction;
  switch (action.type) {
    // getGames
    case GAMES_GET_ALL_PENDING:
      return { ...state, gamesStatus: AsyncStatus.Loading, error: null };
    case GAMES_GET_ALL_FULFILLED:
      return { ...state, gamesStatus: AsyncStatus.Succeeded, games: action.payload };
    case GAMES_GET_ALL_REJECTED:
      return { ...state, gamesStatus: AsyncStatus.Failed, error: action.error };

    // getGame
    case GAMES_GET_ONE_PENDING:
      return { ...state, selectedGameStatus: AsyncStatus.Loading, error: null };
    case GAMES_GET_ONE_FULFILLED:
      return { ...state, selectedGameStatus: AsyncStatus.Succeeded, selectedGame: action.payload };
    case GAMES_GET_ONE_REJECTED:
      return { ...state, selectedGameStatus: AsyncStatus.Failed, error: action.error };

    // getGameStats
    case GAMES_GET_STATS_PENDING:
      return { ...state, statsStatus: AsyncStatus.Loading, error: null };
    case GAMES_GET_STATS_FULFILLED:
      return { ...state, statsStatus: AsyncStatus.Succeeded, stats: action.payload };
    case GAMES_GET_STATS_REJECTED:
      return { ...state, statsStatus: AsyncStatus.Failed, error: action.error };

    // createGame
    case GAMES_CREATE_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
    case GAMES_CREATE_FULFILLED:
      return { ...state, mutationStatus: AsyncStatus.Succeeded, games: [...state.games, action.payload] };
    case GAMES_CREATE_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    // updateGame
    case GAMES_UPDATE_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
    case GAMES_UPDATE_FULFILLED: {
      const updated = action.payload;
      return {
        ...state,
        mutationStatus: AsyncStatus.Succeeded,
        games: state.games.map((g) => (g.id === updated.id ? updated : g)),
        selectedGame: state.selectedGame?.id === updated.id ? updated : state.selectedGame,
      };
    }
    case GAMES_UPDATE_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    // remapGame
    case GAMES_REMAP_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
    case GAMES_REMAP_FULFILLED: {
      const updated = action.payload;
      return {
        ...state,
        mutationStatus: AsyncStatus.Succeeded,
        games: state.games.map((g) => (g.id === updated.id ? updated : g)),
        selectedGame: state.selectedGame?.id === updated.id ? updated : state.selectedGame,
      };
    }
    case GAMES_REMAP_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    // deleteGame
    case GAMES_DELETE_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
    case GAMES_DELETE_FULFILLED: {
      const id = action.meta.arg;
      return {
        ...state,
        mutationStatus: AsyncStatus.Succeeded,
        games: state.games.filter((g) => g.id !== id),
        selectedGame: state.selectedGame?.id === id ? null : state.selectedGame,
      };
    }
    case GAMES_DELETE_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    default:
      return state;
  }
}

export default gamesReducer;
