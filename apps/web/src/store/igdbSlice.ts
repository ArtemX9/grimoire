import { IgdbGame } from '@grimoire/shared';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export const IGDB_SLICE = 'igdb';

export interface IgdbState {
  searchResults: IgdbGame[];
  isSearchLoading: boolean;

  selectedGame: IgdbGame | null;
  isSelectedGameLoading: boolean;
}

const initialState: IgdbState = {
  searchResults: [],
  isSearchLoading: false,

  selectedGame: null,
  isSelectedGameLoading: false,
};

const igdbSlice = createSlice({
  name: IGDB_SLICE,
  initialState,
  reducers: {
    searchLoadingStarted: (state) => {
      state.isSearchLoading = true;
    },
    searchLoaded: (state, action: PayloadAction<IgdbGame[]>) => {
      state.searchResults = action.payload;
      state.isSearchLoading = false;
    },
    searchFailed: (state) => {
      state.isSearchLoading = false;
    },
    searchCleared: (state) => {
      state.searchResults = [];
      state.isSearchLoading = false;
    },

    igdbGameLoadingStarted: (state) => {
      state.isSelectedGameLoading = true;
      state.selectedGame = null;
    },
    igdbGameLoaded: (state, action: PayloadAction<IgdbGame>) => {
      state.selectedGame = action.payload;
      state.isSelectedGameLoading = false;
    },
    igdbGameFailed: (state) => {
      state.isSelectedGameLoading = false;
    },
  },
});

export const {
  searchLoadingStarted,
  searchLoaded,
  searchFailed,
  searchCleared,
  igdbGameLoadingStarted,
  igdbGameLoaded,
  igdbGameFailed,
} = igdbSlice.actions;

export default igdbSlice.reducer;
