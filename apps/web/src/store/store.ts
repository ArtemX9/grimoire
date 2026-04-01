import { configureStore } from '@reduxjs/toolkit';

import { api } from '@/api/api';
// Import API slices to trigger endpoint injection
import '@/api/authApi';
import '@/api/gamesApi';
import '@/api/igdbApi';
import '@/api/sessionsApi';
import '@/api/steamApi';
import '@/api/usersApi';
import aiReducer, { AI_SLICE } from '@/store/aiSlice';
import authReducer, { AUTH_SLICE } from '@/store/authSlice';
import filtersReducer, { FILTERS_SLICE } from '@/store/filtersSlice';
import gamesReducer, { GAMES_SLICE } from '@/store/gamesSlice';
import uiReducer, { UI_SLICE } from '@/store/uiSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [AUTH_SLICE]: authReducer,
    [FILTERS_SLICE]: filtersReducer,
    [GAMES_SLICE]: gamesReducer,
    [AI_SLICE]: aiReducer,
    [UI_SLICE]: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
