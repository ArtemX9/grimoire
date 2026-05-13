import { configureStore } from '@reduxjs/toolkit';

import aiReducer, { AI_SLICE } from '@/store/aiSlice';
import filtersReducer, { FILTERS_SLICE } from '@/store/filtersSlice';
import uiReducer, { UI_SLICE } from '@/store/uiSlice';

export const store = configureStore({
  reducer: {
    [FILTERS_SLICE]: filtersReducer,
    [AI_SLICE]: aiReducer,
    [UI_SLICE]: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
