import { configureStore } from '@reduxjs/toolkit';

import aiReducer from '@/features/ai/aiSlice';
// Import API slices to trigger endpoint injection
import '@/features/auth/authApi';
import filtersReducer from '@/features/games/filtersSlice';
import '@/features/games/gamesApi';
import '@/features/igdb/igdbApi';
import '@/features/platforms/steam/steamApi';
import '@/features/sessions/sessionsApi';
import uiReducer from '@/features/ui/uiSlice';
import '@/features/users/usersApi';

import { api } from './api';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    filters: filtersReducer,
    ai: aiReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
