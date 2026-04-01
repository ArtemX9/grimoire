import { CreateGameDto, GameStatus, UpdateGameDto, UserGame } from '@grimoire/shared';

import { api } from './api';

interface GameStats {
  total: number;
  byStatus: Array<{ status: GameStatus; _count: number }>;
  totalHours: number;
}

interface GamesQuery {
  status?: GameStatus;
  genre?: string;
  search?: string;
}

export const gamesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGames: builder.query<UserGame[], GamesQuery>({
      query: (params = {}) => ({
        url: 'games',
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
      }),
      providesTags: ['Game'],
    }),

    getGameStats: builder.query<GameStats, void>({
      query: () => 'games/stats',
      providesTags: ['Stats'],
    }),

    getGame: builder.query<UserGame, string>({
      query: (id) => `games/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Game', id }],
    }),

    createGame: builder.mutation<UserGame, CreateGameDto>({
      query: (body) => ({ url: 'games', method: 'POST', body }),
      invalidatesTags: ['Game', 'Stats'],
    }),

    updateGame: builder.mutation<UserGame, { id: string; data: UpdateGameDto }>({
      query: ({ id, data }) => ({ url: `games/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Game', id }, 'Stats'],
    }),

    deleteGame: builder.mutation<void, string>({
      query: (id) => ({ url: `games/${id}`, method: 'DELETE' }),
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
