import { MapUnmappedGameSchemaDto, UnmappedGame } from '@grimoire/shared';

import { api } from './api';

export type UnmappedGamesQuery = {
  limit?: number;
  offset?: number;
};

export type MapUnmappedGameArgs = {
  id: string;
  body: MapUnmappedGameSchemaDto;
};

const BASE_URL_PATH = 'unmapped-games';

export const unmappedGamesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUnmappedGames: builder.query<UnmappedGame[], UnmappedGamesQuery>({
      query: (params = {}) => ({
        url: BASE_URL_PATH,
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)),
      }),
      providesTags: ['UnmappedGame'],
    }),

    mapUnmappedGame: builder.mutation<void, MapUnmappedGameArgs>({
      query: ({ id, body }) => ({ url: `${BASE_URL_PATH}/map/${id}`, method: 'POST', body }),
      invalidatesTags: ['UnmappedGame', 'Game'],
    }),
  }),
});

export const { useGetUnmappedGamesQuery, useMapUnmappedGameMutation } = unmappedGamesApi;
