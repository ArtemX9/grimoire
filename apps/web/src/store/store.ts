import { composeWithDevTools } from '@redux-devtools/extension';
import type { Action, Reducer } from 'redux';
import { applyMiddleware, combineReducers, legacy_createStore as createStore } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { thunk } from 'redux-thunk';

import { gamesMiddleware } from '@/store/middleware/games/index';
import { ADMIN_SLICE, AdminState, adminReducer } from '@/store/state/admin/index';
import { AI_SLICE, AiState, aiReducer } from '@/store/state/ai/index';
import { AUTH_SLICE, AuthState, authReducer } from '@/store/state/auth/index';
import { FILTERS_SLICE, FiltersState, filtersReducer } from '@/store/state/filters/index';
import { GAMES_SLICE, GamesState, gamesReducer } from '@/store/state/games/index';
import { IGDB_SLICE, IgdbState, igdbReducer } from '@/store/state/igdb/index';
import { PLAYSTATION_SLICE, PlaystationState, playstationReducer } from '@/store/state/playstation/index';
import { SESSIONS_SLICE, SessionsState, sessionsReducer } from '@/store/state/sessions/index';
import { STEAM_SLICE, SteamState, steamReducer } from '@/store/state/steam/index';
import { UI_SLICE, UiState, uiReducer } from '@/store/state/ui/index';
import { UNMAPPED_GAMES_SLICE, UnmappedGamesState, unmappedGamesReducer } from '@/store/state/unmappedGames/index';
import { USERS_SLICE, UsersState, usersReducer } from '@/store/state/users/index';
import { XBOX_SLICE, XboxState, xboxReducer } from '@/store/state/xbox/index';

export interface IRootReducer {
  [FILTERS_SLICE]: FiltersState;
  [AI_SLICE]: AiState;
  [UI_SLICE]: UiState;
  [ADMIN_SLICE]: AdminState;
  [AUTH_SLICE]: AuthState;
  [USERS_SLICE]: UsersState;
  [GAMES_SLICE]: GamesState;
  [SESSIONS_SLICE]: SessionsState;
  [IGDB_SLICE]: IgdbState;
  [STEAM_SLICE]: SteamState;
  [PLAYSTATION_SLICE]: PlaystationState;
  [XBOX_SLICE]: XboxState;
  [UNMAPPED_GAMES_SLICE]: UnmappedGamesState;
}

const rootReducer = combineReducers({
  [FILTERS_SLICE]: filtersReducer,
  [AI_SLICE]: aiReducer,
  [UI_SLICE]: uiReducer,
  [ADMIN_SLICE]: adminReducer,
  [AUTH_SLICE]: authReducer,
  [USERS_SLICE]: usersReducer,
  [GAMES_SLICE]: gamesReducer,
  [SESSIONS_SLICE]: sessionsReducer,
  [IGDB_SLICE]: igdbReducer,
  [STEAM_SLICE]: steamReducer,
  [PLAYSTATION_SLICE]: playstationReducer,
  [XBOX_SLICE]: xboxReducer,
  [UNMAPPED_GAMES_SLICE]: unmappedGamesReducer,
});

export type RootState = IRootReducer;

export type AppDispatch = ThunkDispatch<RootState, undefined, Action>;

export type AppThunk<R = void> = ThunkAction<R, RootState, undefined, Action>;

export const store = createStore(rootReducer, {}, composeWithDevTools(applyMiddleware(thunk, gamesMiddleware)));

export default store;
