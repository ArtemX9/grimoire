import { UserGame } from '@grimoire/shared';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { GameStats } from '@/api/gamesApi';

export const GAMES_SLICE = 'games';

export interface GamesState {
  games: UserGame[];
  isGamesLoading: boolean;
  stats: GameStats | null;
  isStatsLoading: boolean;
  selectedGame: UserGame | null;
  isSelectedGameLoading: boolean;
}

const initialState: GamesState = {
  games: [],
  isGamesLoading: false,
  stats: null,
  isStatsLoading: false,
  selectedGame: null,
  isSelectedGameLoading: false,
};

const gamesSlice = createSlice({
  name: GAMES_SLICE,
  initialState,
  reducers: {
    gamesLoadingStarted: (state) => {
      state.isGamesLoading = true;
    },
    gamesLoaded: (state, action: PayloadAction<UserGame[]>) => {
      state.games = action.payload;
      state.isGamesLoading = false;
    },
    gamesFailed: (state) => {
      state.isGamesLoading = false;
    },

    statsLoadingStarted: (state) => {
      state.isStatsLoading = true;
    },
    statsLoaded: (state, action: PayloadAction<GameStats>) => {
      state.stats = action.payload;
      state.isStatsLoading = false;
    },
    statsFailed: (state) => {
      state.isStatsLoading = false;
    },

    selectedGameLoadingStarted: (state) => {
      state.isSelectedGameLoading = true;
      state.selectedGame = null;
    },
    selectedGameLoaded: (state, action: PayloadAction<UserGame>) => {
      state.selectedGame = action.payload;
      state.isSelectedGameLoading = false;
    },
    selectedGameFailed: (state) => {
      state.isSelectedGameLoading = false;
    },
    selectedGamePatched: (state, action: PayloadAction<UserGame>) => {
      state.selectedGame = action.payload;
      if (state.selectedGame !== null) {
        const idx = state.games.findIndex((g) => g.id === action.payload.id);
        if (idx !== -1) {
          state.games[idx] = action.payload;
        }
      }
    },
    selectedGameRemoved: (state, action: PayloadAction<string>) => {
      state.games = state.games.filter((g) => g.id !== action.payload);
      state.selectedGame = null;
    },
  },
});

export const {
  gamesLoadingStarted,
  gamesLoaded,
  gamesFailed,
  statsLoadingStarted,
  statsLoaded,
  statsFailed,
  selectedGameLoadingStarted,
  selectedGameLoaded,
  selectedGameFailed,
  selectedGamePatched,
  selectedGameRemoved,
} = gamesSlice.actions;

export default gamesSlice.reducer;
