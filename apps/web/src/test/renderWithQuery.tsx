import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { type Reducer, applyMiddleware, combineReducers, createStore } from 'redux';
import { thunk } from 'redux-thunk';

import adminReducer, { ADMIN_SLICE } from '@/store/state/admin/index';
import aiReducer, { AI_SLICE } from '@/store/state/ai/index';
import authReducer, { AUTH_SLICE } from '@/store/state/auth/index';
import filtersReducer, { FILTERS_SLICE } from '@/store/state/filters/index';
import gamesReducer, { GAMES_SLICE } from '@/store/state/games/index';
import igdbReducer, { IGDB_SLICE } from '@/store/state/igdb/index';
import playstationReducer, { PLAYSTATION_SLICE } from '@/store/state/playstation/index';
import sessionsReducer, { SESSIONS_SLICE } from '@/store/state/sessions/index';
import steamReducer, { STEAM_SLICE } from '@/store/state/steam/index';
import uiReducer, { UI_SLICE } from '@/store/state/ui/index';
import unmappedGamesReducer, { UNMAPPED_GAMES_SLICE } from '@/store/state/unmappedGames/index';
import usersReducer, { USERS_SLICE } from '@/store/state/users/index';
import xboxReducer, { XBOX_SLICE } from '@/store/state/xbox/index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rootReducer: Reducer<any, any> = combineReducers({
  [FILTERS_SLICE]: filtersReducer,
  [AI_SLICE]: aiReducer,
  [UI_SLICE]: uiReducer,
  [AUTH_SLICE]: authReducer,
  [USERS_SLICE]: usersReducer,
  [GAMES_SLICE]: gamesReducer,
  [SESSIONS_SLICE]: sessionsReducer,
  [IGDB_SLICE]: igdbReducer,
  [STEAM_SLICE]: steamReducer,
  [PLAYSTATION_SLICE]: playstationReducer,
  [XBOX_SLICE]: xboxReducer,
  [UNMAPPED_GAMES_SLICE]: unmappedGamesReducer,
  [ADMIN_SLICE]: adminReducer,
});

export function makeStore() {
  return createStore(rootReducer, applyMiddleware(thunk));
}

export function renderWithStore(ui: React.ReactElement): ReturnType<typeof render> {
  const store = makeStore();

  return render(<Provider store={store}>{ui}</Provider>);
}

// Backwards-compatible alias
export const renderWithQuery = renderWithStore;
