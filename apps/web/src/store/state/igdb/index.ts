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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function igdbReducer(state = initialState, rawAction: any): IgdbState {
  const action = rawAction as IgdbAction;
  switch (action.type) {
    // searchIgdb
    case IGDB_SEARCH_PENDING:
      return { ...state, searchStatus: AsyncStatus.Loading, error: null };
    case IGDB_SEARCH_FULFILLED:
      return { ...state, searchStatus: AsyncStatus.Succeeded, searchResults: action.payload };
    case IGDB_SEARCH_REJECTED:
      return { ...state, searchStatus: AsyncStatus.Failed, error: action.error };

    // getIgdbGame
    case IGDB_GET_GAME_PENDING:
      return { ...state, getStatus: AsyncStatus.Loading, error: null };
    case IGDB_GET_GAME_FULFILLED:
      return { ...state, getStatus: AsyncStatus.Succeeded, selectedGame: action.payload };
    case IGDB_GET_GAME_REJECTED:
      return { ...state, getStatus: AsyncStatus.Failed, error: action.error };

    // clearSearchResults
    case IGDB_CLEAR_SEARCH_RESULTS:
      return { ...state, searchResults: [], searchStatus: AsyncStatus.Idle };

    default:
      return state;
  }
}

export default igdbReducer;
