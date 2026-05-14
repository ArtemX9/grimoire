import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import aiReducer, { AI_SLICE } from '@/store/aiSlice';
import filtersReducer, { FILTERS_SLICE } from '@/store/filtersSlice';
import uiReducer, { UI_SLICE } from '@/store/uiSlice';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

export function makeStore() {
  return configureStore({
    reducer: {
      [FILTERS_SLICE]: filtersReducer,
      [AI_SLICE]: aiReducer,
      [UI_SLICE]: uiReducer,
    },
  });
}

export function renderWithQuery(ui: React.ReactElement, queryClient?: QueryClient): ReturnType<typeof render> {
  const client = queryClient ?? makeQueryClient();
  const store = makeStore();

  return render(
    <QueryClientProvider client={client}>
      <Provider store={store}>{ui}</Provider>
    </QueryClientProvider>,
  );
}
