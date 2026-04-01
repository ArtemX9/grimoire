import { CreateGameDto, GameStatus, UpdateGameDto, UserGame } from '@grimoire/shared';

import { api } from './api';

export type GameStats = {
  total: number;
  byStatus: Array<{ status: GameStatus; _count: number }>;
  totalHours: number;
};

export type GamesQuery = {
  status?: GameStatus;
  genre?: string;
  search?: string;
};

export type UpdateGameArgs = {
  id: string;
  data: UpdateGameDto;
};

const BASE_URL_PATH = 'games';
export const gamesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGames: builder.query<UserGame[], GamesQuery>({
      query: (params = {}) => ({
        url: BASE_URL_PATH,
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
      }),
      providesTags: ['Game'],
    }),

    getGameStats: builder.query<GameStats, void>({
      query: () => `${BASE_URL_PATH}/stats`,
      providesTags: ['Stats'],
    }),

    getGame: builder.query<UserGame, string>({
      query: (id) => `${BASE_URL_PATH}/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Game', id }],
    }),

    createGame: builder.mutation<UserGame, CreateGameDto>({
      query: (body) => ({ url: BASE_URL_PATH, method: 'POST', body }),
      invalidatesTags: ['Game', 'Stats'],
    }),

    updateGame: builder.mutation<UserGame, UpdateGameArgs>({
      query: ({ id, data }) => ({ url: `${BASE_URL_PATH}/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Game', id }, 'Stats'],
    }),

    deleteGame: builder.mutation<void, string>({
      query: (id) => ({ url: `${BASE_URL_PATH}/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Game', 'Stats'],
    }),
  }),
});

export const {
  useGetGamesQuery,
  useGetGameStatsQuery,
  useGetGameQuery,
  useCreateGameMutation,
  useUpdateGameMutation,
  useDeleteGameMutation,
} = gamesApi;
