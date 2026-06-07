import { AsyncStatus, IgdbGame } from '@grimoire/shared';

import {
  IGDB_CLEAR_SEARCH_RESULTS,
  IGDB_GET_GAME_FULFILLED,
  IGDB_GET_GAME_PENDING,
  IGDB_GET_GAME_REJECTED,
  IGDB_SEARCH_FULFILLED,
  IGDB_SEARCH_PENDING,
  IGDB_SEARCH_REJECTED,
  type IgdbAction,
  clearSearchResults,
  igdbGetGameFulfilled,
  igdbGetGamePending,
  igdbGetGameRejected,
  igdbSearchFulfilled,
  igdbSearchPending,
  igdbSearchRejected,
} from '@/store/actions/igdb';

export { clearSearchResults } from '@/store/actions/igdb';

export const IGDB_SLICE = 'igdb';

export interface IgdbState {
  searchResults: IgdbGame[];
  selectedGame: IgdbGame | null;
  searchStatus: AsyncStatus;
  getStatus: AsyncStatus;
  error: string | null;
}

const initialState: IgdbState = {
  searchResults: [],
  selectedGame: null,
  searchStatus: AsyncStatus.Idle,
  getStatus: AsyncStatus.Idle,
  error: null,
};

export function igdbReducer(state = initialState, action: IgdbAction): IgdbState {
  switch (action.type) {
    // searchIgdb
    case IGDB_SEARCH_PENDING:
      return handleIgdbSearchStart(state, action as ReturnType<typeof igdbSearchPending>);
    case IGDB_SEARCH_FULFILLED:
      return handleIgdbSearchSuccess(state, action as ReturnType<typeof igdbSearchFulfilled>);
    case IGDB_SEARCH_REJECTED:
      return handleIgdbSearchFailure(state, action as ReturnType<typeof igdbSearchRejected>);

    // getIgdbGame
    case IGDB_GET_GAME_PENDING:
      return handleIgdbGetGameStart(state, action as ReturnType<typeof igdbGetGamePending>);
    case IGDB_GET_GAME_FULFILLED:
      return handleIgdbGetGameSuccess(state, action as ReturnType<typeof igdbGetGameFulfilled>);
    case IGDB_GET_GAME_REJECTED:
      return handleIgdbGetGameFailure(state, action as ReturnType<typeof igdbGetGameRejected>);

    // clearSearchResults
    case IGDB_CLEAR_SEARCH_RESULTS:
      return handleIgdbClearSearchResults(state, action as ReturnType<typeof clearSearchResults>);

    default:
      return state;
  }
}

// searchIgdb
function handleIgdbSearchStart(state: IgdbState, _action: ReturnType<typeof igdbSearchPending>): IgdbState {
  return { ...state, searchStatus: AsyncStatus.Loading, error: null };
}
function handleIgdbSearchSuccess(state: IgdbState, action: ReturnType<typeof igdbSearchFulfilled>): IgdbState {
  return { ...state, searchStatus: AsyncStatus.Succeeded, searchResults: action.payload.games };
}
function handleIgdbSearchFailure(state: IgdbState, action: ReturnType<typeof igdbSearchRejected>): IgdbState {
  return { ...state, searchStatus: AsyncStatus.Failed, error: action.payload.error };
}

// getIgdbGame
function handleIgdbGetGameStart(state: IgdbState, _action: ReturnType<typeof igdbGetGamePending>): IgdbState {
  return { ...state, getStatus: AsyncStatus.Loading, error: null };
}
function handleIgdbGetGameSuccess(state: IgdbState, action: ReturnType<typeof igdbGetGameFulfilled>): IgdbState {
  return { ...state, getStatus: AsyncStatus.Succeeded, selectedGame: action.payload.game };
}
function handleIgdbGetGameFailure(state: IgdbState, action: ReturnType<typeof igdbGetGameRejected>): IgdbState {
  return { ...state, getStatus: AsyncStatus.Failed, error: action.payload.error };
}

// clearSearchResults
function handleIgdbClearSearchResults(state: IgdbState, _action: ReturnType<typeof clearSearchResults>): IgdbState {
  return { ...state, searchResults: [], searchStatus: AsyncStatus.Idle };
}

export default igdbReducer;
