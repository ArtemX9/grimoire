import { IgdbGame } from '@grimoire/shared';

import { api } from './api';

const BASE_URL_PATH = 'igdb';
export const igdbApi = api.injectEndpoints({
  endpoints: (builder) => ({
    searchIgdb: builder.query<IgdbGame[], string>({
      query: (q) => ({ url: `${BASE_URL_PATH}/search`, params: { q } }),
    }),

    getIgdbGame: builder.query<IgdbGame, number>({
      query: (id) => `${BASE_URL_PATH}/${id}`,
    }),
  }),
});

export const { useSearchIgdbQuery, useGetIgdbGameQuery } = igdbApi;
