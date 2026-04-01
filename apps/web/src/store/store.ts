import { configureStore } from '@reduxjs/toolkit';

// Import API slices to trigger endpoint injection
import '@/api/authApi';
import '@/api/gamesApi';
import '@/api/igdbApi';
import '@/api/sessionsApi';
import '@/api/steamApi';
import '@/api/usersApi';
import aiReducer from '@/store/aiSlice';
import filtersReducer from '@/store/filtersSlice';
import uiReducer from '@/store/uiSlice';

import { api } from '../api/api';

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
