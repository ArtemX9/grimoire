import { GameStatus, Genre, Platform, SortableField } from '@grimoire/shared';

export const FILTERS_SLICE = 'filters';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const FILTERS_SET_STATUS = 'filters/SET_STATUS';
export const FILTERS_SET_GENRE = 'filters/SET_GENRE';
export const FILTERS_SET_PLATFORM = 'filters/SET_PLATFORM';
export const FILTERS_SET_SEARCH = 'filters/SET_SEARCH';
export const FILTERS_SET_SORT_BY = 'filters/SET_SORT_BY';
export const FILTERS_SET_ORDER = 'filters/SET_ORDER';
export const FILTERS_RESET = 'filters/RESET';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const setStatusFilter = (payload: GameStatus | null) => ({ type: FILTERS_SET_STATUS, payload }) as const;

export const setGenreFilter = (payload: Genre | null) => ({ type: FILTERS_SET_GENRE, payload }) as const;

export const setPlatformFilter = (payload: Platform | null) => ({ type: FILTERS_SET_PLATFORM, payload }) as const;

export const setSearch = (payload: string) => ({ type: FILTERS_SET_SEARCH, payload }) as const;

export const setSortBy = (payload: SortableField | null) => ({ type: FILTERS_SET_SORT_BY, payload }) as const;

export const setOrder = (payload: 'asc' | 'desc') => ({ type: FILTERS_SET_ORDER, payload }) as const;

export const resetFilters = () => ({ type: FILTERS_RESET }) as const;

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type FiltersAction =
  | ReturnType<typeof setStatusFilter>
  | ReturnType<typeof setGenreFilter>
  | ReturnType<typeof setPlatformFilter>
  | ReturnType<typeof setSearch>
  | ReturnType<typeof setSortBy>
  | ReturnType<typeof setOrder>
  | ReturnType<typeof resetFilters>;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface FiltersState {
  status: GameStatus | null;
  genre: Genre | null;
  platform: Platform | null;
  search: string;
  sortBy: SortableField | null;
  order: 'asc' | 'desc';
}

const initialState: FiltersState = {
  status: null,
  genre: null,
  platform: null,
  search: '',
  sortBy: null,
  order: 'asc',
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filtersReducer(state = initialState, rawAction: any): FiltersState {
  const action = rawAction as FiltersAction;
  switch (action.type) {
    case FILTERS_SET_STATUS:
      return { ...state, status: action.payload };
    case FILTERS_SET_GENRE:
      return { ...state, genre: action.payload };
    case FILTERS_SET_PLATFORM:
      return { ...state, platform: action.payload };
    case FILTERS_SET_SEARCH:
      return { ...state, search: action.payload };
    case FILTERS_SET_SORT_BY:
      return { ...state, sortBy: action.payload };
    case FILTERS_SET_ORDER:
      return { ...state, order: action.payload };
    case FILTERS_RESET:
      return initialState;
    default:
      return state;
  }
}

export default filtersReducer;
