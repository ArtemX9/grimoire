import { GameStatus, Genre, Platform, SortableField } from '@grimoire/shared';

import {
  FILTERS_RESET,
  FILTERS_SET_GENRE,
  FILTERS_SET_ORDER,
  FILTERS_SET_PLATFORM,
  FILTERS_SET_SEARCH,
  FILTERS_SET_SORT_BY,
  FILTERS_SET_STATUS,
  type FiltersAction,
  resetFilters,
  setGenreFilter,
  setOrder,
  setPlatformFilter,
  setSearch,
  setSortBy,
  setStatusFilter,
} from '@/store/actions/filters';

export {
  resetFilters,
  setGenreFilter,
  setOrder,
  setPlatformFilter,
  setSearch,
  setSortBy,
  setStatusFilter,
} from '@/store/actions/filters';

export const FILTERS_SLICE = 'filters';

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

export function filtersReducer(state = initialState, action: FiltersAction): FiltersState {
  switch (action.type) {
    // setStatus
    case FILTERS_SET_STATUS:
      return handleFiltersSetStatus(state, action as ReturnType<typeof setStatusFilter>);

    // setGenre
    case FILTERS_SET_GENRE:
      return handleFiltersSetGenre(state, action as ReturnType<typeof setGenreFilter>);

    // setPlatform
    case FILTERS_SET_PLATFORM:
      return handleFiltersSetPlatform(state, action as ReturnType<typeof setPlatformFilter>);

    // setSearch
    case FILTERS_SET_SEARCH:
      return handleFiltersSetSearch(state, action as ReturnType<typeof setSearch>);

    // setSortBy
    case FILTERS_SET_SORT_BY:
      return handleFiltersSetSortBy(state, action as ReturnType<typeof setSortBy>);

    // setOrder
    case FILTERS_SET_ORDER:
      return handleFiltersSetOrder(state, action as ReturnType<typeof setOrder>);

    // reset
    case FILTERS_RESET:
      return handleFiltersReset(state, action as ReturnType<typeof resetFilters>);

    default:
      return state;
  }
}

// setStatus
function handleFiltersSetStatus(state: FiltersState, action: ReturnType<typeof setStatusFilter>): FiltersState {
  return { ...state, status: action.payload.gameStatus };
}

// setGenre
function handleFiltersSetGenre(state: FiltersState, action: ReturnType<typeof setGenreFilter>): FiltersState {
  return { ...state, genre: action.payload.genre };
}

// setPlatform
function handleFiltersSetPlatform(state: FiltersState, action: ReturnType<typeof setPlatformFilter>): FiltersState {
  return { ...state, platform: action.payload.platform };
}

// setSearch
function handleFiltersSetSearch(state: FiltersState, action: ReturnType<typeof setSearch>): FiltersState {
  return { ...state, search: action.payload.searchString };
}

// setSortBy
function handleFiltersSetSortBy(state: FiltersState, action: ReturnType<typeof setSortBy>): FiltersState {
  return { ...state, sortBy: action.payload.sortBy };
}

// setOrder
function handleFiltersSetOrder(state: FiltersState, action: ReturnType<typeof setOrder>): FiltersState {
  return { ...state, order: action.payload.order };
}

// reset
function handleFiltersReset(_state: FiltersState, _action: ReturnType<typeof resetFilters>): FiltersState {
  return initialState;
}

export default filtersReducer;
