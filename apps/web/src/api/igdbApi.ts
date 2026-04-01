import { IgdbGame } from '@grimoire/shared';

import { api } from './api';

export const igdbApi = api.injectEndpoints({
  endpoints: (builder) => ({
    searchIgdb: builder.query<IgdbGame[], string>({
      query: (q) => ({ url: 'igdb/search', params: { q } }),
    }),

    getIgdbGame: builder.query<IgdbGame, number>({
      query: (id) => `igdb/${id}`,
    }),
  }),
});

export const { useSearchIgdbQuery, useGetIgdbGameQuery } = igdbApi;
