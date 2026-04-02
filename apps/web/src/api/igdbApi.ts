import { IgdbGame } from '@grimoire/shared';

import {
  igdbGameFailed,
  igdbGameLoaded,
  igdbGameLoadingStarted,
  searchFailed,
  searchLoaded,
  searchLoadingStarted,
} from '@/store/igdbSlice';

import { api } from './api';

const BASE_URL_PATH = 'igdb';

export const igdbApi = api.injectEndpoints({
  endpoints: (builder) => ({
    searchIgdb: builder.query<IgdbGame[], string>({
      query: (q) => ({ url: `${BASE_URL_PATH}/search`, params: { q } }),
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        dispatch(searchLoadingStarted());
        try {
          const { data } = await queryFulfilled;
          dispatch(searchLoaded(data));
        } catch {
          dispatch(searchFailed());
        }
      },
    }),

    getIgdbGame: builder.query<IgdbGame, number>({
      query: (id) => `${BASE_URL_PATH}/${id}`,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        dispatch(igdbGameLoadingStarted());
        try {
          const { data } = await queryFulfilled;
          dispatch(igdbGameLoaded(data));
        } catch {
          dispatch(igdbGameFailed());
        }
      },
    }),
  }),
});

export const { useSearchIgdbQuery } = igdbApi;
