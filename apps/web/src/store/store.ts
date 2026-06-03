import { composeWithDevTools } from '@redux-devtools/extension';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import type { Action } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { thunk } from 'redux-thunk';

import { gamesMiddleware } from '@/store/middleware/games/index';
import { ADMIN_SLICE, adminReducer } from '@/store/state/admin/index';
import { AI_SLICE, aiReducer } from '@/store/state/ai/index';
import { AUTH_SLICE, authReducer } from '@/store/state/auth/index';
import { FILTERS_SLICE, filtersReducer } from '@/store/state/filters/index';
import { GAMES_SLICE, gamesReducer } from '@/store/state/games/index';
import { IGDB_SLICE, igdbReducer } from '@/store/state/igdb/index';
import { PLAYSTATION_SLICE, playstationReducer } from '@/store/state/playstation/index';
import { SESSIONS_SLICE, sessionsReducer } from '@/store/state/sessions/index';
import { STEAM_SLICE, steamReducer } from '@/store/state/steam/index';
import { UI_SLICE, uiReducer } from '@/store/state/ui/index';
import { UNMAPPED_GAMES_SLICE, unmappedGamesReducer } from '@/store/state/unmappedGames/index';
import { USERS_SLICE, usersReducer } from '@/store/state/users/index';
import { XBOX_SLICE, xboxReducer } from '@/store/state/xbox/index';

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

export type RootState = ReturnType<typeof rootReducer>;

export type AppDispatch = ThunkDispatch<RootState, undefined, Action>;

export type AppThunk<R = void> = ThunkAction<R, RootState, undefined, Action>;

export const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk, gamesMiddleware)));

export default store;
