import { GameStatus, Genre, Platform, SortableField } from '@grimoire/shared';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export const FILTERS_SLICE = 'filters';

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

const filtersSlice = createSlice({
  name: FILTERS_SLICE,
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<GameStatus | null>) => {
      state.status = action.payload;
    },
    setGenreFilter: (state, action: PayloadAction<Genre | null>) => {
      state.genre = action.payload;
    },
    setPlatformFilter: (state, action: PayloadAction<Platform | null>) => {
      state.platform = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setSortBy: (state, action: PayloadAction<SortableField | null>) => {
      state.sortBy = action.payload;
    },
    setOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.order = action.payload;
    },
    resetFilters: () => initialState,
  },
});

export const { setStatusFilter, setGenreFilter, setPlatformFilter, setSearch, setSortBy, setOrder, resetFilters } =
  filtersSlice.actions;
export default filtersSlice.reducer;
