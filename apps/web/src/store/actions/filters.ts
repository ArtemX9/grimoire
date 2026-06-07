// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------
import { GameStatus, Genre, Platform, SortableField } from '@grimoire/shared';

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

export const setStatusFilter = (gameStatus: GameStatus | null) => ({
  type: FILTERS_SET_STATUS,
  payload: {
    gameStatus,
  },
});

export const setGenreFilter = (genre: Genre | null) => ({
  type: FILTERS_SET_GENRE,
  payload: {
    genre,
  },
});

export const setPlatformFilter = (platform: Platform | null) => ({
  type: FILTERS_SET_PLATFORM,
  payload: {
    platform,
  },
});

export const setSearch = (searchString: string) => ({
  type: FILTERS_SET_SEARCH,
  payload: {
    searchString,
  },
});

export const setSortBy = (sortBy: SortableField | null) => ({
  type: FILTERS_SET_SORT_BY,
  payload: {
    sortBy,
  },
});

export const setOrder = (order: 'asc' | 'desc') => ({
  type: FILTERS_SET_ORDER,
  payload: {
    order,
  },
});

export const resetFilters = () => ({ type: FILTERS_RESET, payload: {} });

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
