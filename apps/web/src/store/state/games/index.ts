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

export function gamesReducer(state = initialState, action: GamesAction): GamesState {
  switch (action.type) {
    // getGames
    case GAMES_GET_ALL_PENDING:
      return handleGamesGetAllStart(state, action as ReturnType<typeof gamesGetAllPending>);
    case GAMES_GET_ALL_FULFILLED:
      return handleGamesGetAllSuccess(state, action as ReturnType<typeof gamesGetAllFulfilled>);
    case GAMES_GET_ALL_REJECTED:
      return handleGamesGetAllFailure(state, action as ReturnType<typeof gamesGetAllRejected>);

    // getGame
    case GAMES_GET_ONE_PENDING:
      return handleGamesGetOneStart(state, action as ReturnType<typeof gamesGetOnePending>);
    case GAMES_GET_ONE_FULFILLED:
      return handleGamesGetOneSuccess(state, action as ReturnType<typeof gamesGetOneFulfilled>);
    case GAMES_GET_ONE_REJECTED:
      return handleGamesGetOneFailure(state, action as ReturnType<typeof gamesGetOneRejected>);

    // getGameStats
    case GAMES_GET_STATS_PENDING:
      return handleGamesGetStatsStart(state, action as ReturnType<typeof gamesGetStatsPending>);
    case GAMES_GET_STATS_FULFILLED:
      return handleGamesGetStatsSuccess(state, action as ReturnType<typeof gamesGetStatsFulfilled>);
    case GAMES_GET_STATS_REJECTED:
      return handleGamesGetStatsFailure(state, action as ReturnType<typeof gamesGetStatsRejected>);

    // createGame
    case GAMES_CREATE_PENDING:
      return handleGamesCreateStart(state, action as ReturnType<typeof gamesCreatePending>);
    case GAMES_CREATE_FULFILLED:
      return handleGamesCreateSuccess(state, action as ReturnType<typeof gamesCreateFulfilled>);
    case GAMES_CREATE_REJECTED:
      return handleGamesCreateFailure(state, action as ReturnType<typeof gamesCreateRejected>);

    // updateGame
    case GAMES_UPDATE_PENDING:
      return handleGamesUpdateStart(state, action as ReturnType<typeof gamesUpdatePending>);
    case GAMES_UPDATE_FULFILLED:
      return handleGamesUpdateSuccess(state, action as ReturnType<typeof gamesUpdateFulfilled>);
    case GAMES_UPDATE_REJECTED:
      return handleGamesUpdateFailure(state, action as ReturnType<typeof gamesUpdateRejected>);

    // remapGame
    case GAMES_REMAP_PENDING:
      return handleGamesRemapStart(state, action as ReturnType<typeof gamesRemapPending>);
    case GAMES_REMAP_FULFILLED:
      return handleGamesRemapSuccess(state, action as ReturnType<typeof gamesRemapFulfilled>);
    case GAMES_REMAP_REJECTED:
      return handleGamesRemapFailure(state, action as ReturnType<typeof gamesRemapRejected>);

    // deleteGame
    case GAMES_DELETE_PENDING:
      return handleGamesDeleteStart(state, action as ReturnType<typeof gamesDeletePending>);
    case GAMES_DELETE_FULFILLED:
      return handleGamesDeleteSuccess(state, action as ReturnType<typeof gamesDeleteFulfilled>);
    case GAMES_DELETE_REJECTED:
      return handleGamesDeleteFailure(state, action as ReturnType<typeof gamesDeleteRejected>);

    default:
      return state;
  }
}

// getGames
function handleGamesGetAllStart(state: GamesState, _action: ReturnType<typeof gamesGetAllPending>): GamesState {
  return { ...state, gamesStatus: AsyncStatus.Loading, error: null };
}
function handleGamesGetAllSuccess(state: GamesState, action: ReturnType<typeof gamesGetAllFulfilled>): GamesState {
  return { ...state, gamesStatus: AsyncStatus.Succeeded, games: action.payload.games };
}
function handleGamesGetAllFailure(state: GamesState, action: ReturnType<typeof gamesGetAllRejected>): GamesState {
  return { ...state, gamesStatus: AsyncStatus.Failed, error: action.payload.error };
}

// getGame
function handleGamesGetOneStart(state: GamesState, _action: ReturnType<typeof gamesGetOnePending>): GamesState {
  return { ...state, selectedGameStatus: AsyncStatus.Loading, error: null };
}
function handleGamesGetOneSuccess(state: GamesState, action: ReturnType<typeof gamesGetOneFulfilled>): GamesState {
  return { ...state, selectedGameStatus: AsyncStatus.Succeeded, selectedGame: action.payload.game };
}
function handleGamesGetOneFailure(state: GamesState, action: ReturnType<typeof gamesGetOneRejected>): GamesState {
  return { ...state, selectedGameStatus: AsyncStatus.Failed, error: action.payload.error };
}

// getGameStats
function handleGamesGetStatsStart(state: GamesState, _action: ReturnType<typeof gamesGetStatsPending>): GamesState {
  return { ...state, statsStatus: AsyncStatus.Loading, error: null };
}
function handleGamesGetStatsSuccess(state: GamesState, action: ReturnType<typeof gamesGetStatsFulfilled>): GamesState {
  return { ...state, statsStatus: AsyncStatus.Succeeded, stats: action.payload.stats };
}
function handleGamesGetStatsFailure(state: GamesState, action: ReturnType<typeof gamesGetStatsRejected>): GamesState {
  return { ...state, statsStatus: AsyncStatus.Failed, error: action.payload.error };
}

// createGame
function handleGamesCreateStart(state: GamesState, _action: ReturnType<typeof gamesCreatePending>): GamesState {
  return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
}
function handleGamesCreateSuccess(state: GamesState, action: ReturnType<typeof gamesCreateFulfilled>): GamesState {
  return { ...state, mutationStatus: AsyncStatus.Succeeded, games: [...state.games, action.payload.game] };
}
function handleGamesCreateFailure(state: GamesState, action: ReturnType<typeof gamesCreateRejected>): GamesState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

// updateGame
function handleGamesUpdateStart(state: GamesState, _action: ReturnType<typeof gamesUpdatePending>): GamesState {
  return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
}
function handleGamesUpdateSuccess(state: GamesState, action: ReturnType<typeof gamesUpdateFulfilled>): GamesState {
  const updated = action.payload.game;
  return {
    ...state,
    mutationStatus: AsyncStatus.Succeeded,
    games: state.games.map((g) => (g.id === updated.id ? updated : g)),
    selectedGame: state.selectedGame?.id === updated.id ? updated : state.selectedGame,
  };
}
function handleGamesUpdateFailure(state: GamesState, action: ReturnType<typeof gamesUpdateRejected>): GamesState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

// remapGame
function handleGamesRemapStart(state: GamesState, _action: ReturnType<typeof gamesRemapPending>): GamesState {
  return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
}
function handleGamesRemapSuccess(state: GamesState, action: ReturnType<typeof gamesRemapFulfilled>): GamesState {
  const updated = action.payload.game;
  return {
    ...state,
    mutationStatus: AsyncStatus.Succeeded,
    games: state.games.map((g) => (g.id === updated.id ? updated : g)),
    selectedGame: state.selectedGame?.id === updated.id ? updated : state.selectedGame,
  };
}
function handleGamesRemapFailure(state: GamesState, action: ReturnType<typeof gamesRemapRejected>): GamesState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

// deleteGame
function handleGamesDeleteStart(state: GamesState, _action: ReturnType<typeof gamesDeletePending>): GamesState {
  return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
}
function handleGamesDeleteSuccess(state: GamesState, action: ReturnType<typeof gamesDeleteFulfilled>): GamesState {
  const { id } = action.payload;
  return {
    ...state,
    mutationStatus: AsyncStatus.Succeeded,
    games: state.games.filter((g) => g.id !== id),
    selectedGame: state.selectedGame?.id === id ? null : state.selectedGame,
  };
}
function handleGamesDeleteFailure(state: GamesState, action: ReturnType<typeof gamesDeleteRejected>): GamesState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

export default gamesReducer;
