import { configureStore } from '@reduxjs/toolkit'

import { api } from './api'
import filtersReducer from '@/features/games/filtersSlice'
import aiReducer from '@/features/ai/aiSlice'
import uiReducer from '@/features/ui/uiSlice'

// Import API slices to trigger endpoint injection
import '@/features/auth/authApi'
import '@/features/games/gamesApi'
import '@/features/sessions/sessionsApi'
import '@/features/igdb/igdbApi'
import '@/features/users/usersApi'
import '@/features/platforms/steam/steamApi'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    filters: filtersReducer,
    ai: aiReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
