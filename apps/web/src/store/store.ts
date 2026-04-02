import { configureStore } from '@reduxjs/toolkit';

import { api } from '@/api/api';
// Import API slices to trigger endpoint injection
import '@/api/adminApi';
import '@/api/authApi';
import '@/api/gamesApi';
import '@/api/igdbApi';
import '@/api/sessionsApi';
import '@/api/steamApi';
import '@/api/usersApi';
import adminReducer, { ADMIN_SLICE } from '@/store/adminSlice';
import aiReducer, { AI_SLICE } from '@/store/aiSlice';
import authReducer, { AUTH_SLICE } from '@/store/authSlice';
import filtersReducer, { FILTERS_SLICE } from '@/store/filtersSlice';
import gamesReducer, { GAMES_SLICE } from '@/store/gamesSlice';
import igdbReducer, { IGDB_SLICE } from '@/store/igdbSlice';
import uiReducer, { UI_SLICE } from '@/store/uiSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [ADMIN_SLICE]: adminReducer,
    [AUTH_SLICE]: authReducer,
    [FILTERS_SLICE]: filtersReducer,
    [GAMES_SLICE]: gamesReducer,
    [IGDB_SLICE]: igdbReducer,
    [AI_SLICE]: aiReducer,
    [UI_SLICE]: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
