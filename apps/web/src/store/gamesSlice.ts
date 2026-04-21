import { UserGame } from '@grimoire/shared';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { GameStats } from '@/api/gamesApi';

// String-based matchers for RTK Query lifecycle actions.
// We cannot import gamesApi here (circular: gamesApi imports from gamesSlice),
// so we match by action type string and endpointName instead.
function isGetGamesAction(type: string) {
  return (action: { type: string; meta?: { arg?: { endpointName?: string } } }) =>
    action.type === type && action.meta?.arg?.endpointName === 'getGames';
}

function isRemapGameFulfilled(action: { type: string; meta?: { arg?: { endpointName?: string } } }) {
  return action.type === 'api/executeMutation/fulfilled' && action.meta?.arg?.endpointName === 'remapGame';
}

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
  extraReducers: (builder) => {
    builder
      .addMatcher(isGetGamesAction('api/executeQuery/pending'), (state) => {
        state.isGamesLoading = true;
      })
      .addMatcher(isGetGamesAction('api/executeQuery/fulfilled'), (state, action: PayloadAction<UserGame[]>) => {
        state.games = action.payload;
        state.isGamesLoading = false;
      })
      .addMatcher(isGetGamesAction('api/executeQuery/rejected'), (state) => {
        state.isGamesLoading = false;
      })
      .addMatcher(isRemapGameFulfilled, (state, action: PayloadAction<UserGame>) => {
        state.games = state.games.map((g) => (g.id === action.payload.id ? action.payload : g));
        if (state.selectedGame?.id === action.payload.id) {
          state.selectedGame = action.payload;
        }
      });
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
