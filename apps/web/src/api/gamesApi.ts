import { CreateGameDto, GameStatus, UpdateGameDto, UserGame } from '@grimoire/shared';

import {
  gamesFailed,
  gamesLoaded,
  gamesLoadingStarted,
  selectedGameFailed,
  selectedGameLoaded,
  selectedGameLoadingStarted,
  selectedGamePatched,
  selectedGameRemoved,
  statsFailed,
  statsLoaded,
  statsLoadingStarted,
} from '@/store/gamesSlice';

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
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        dispatch(gamesLoadingStarted());
        try {
          const { data } = await queryFulfilled;
          dispatch(gamesLoaded(data));
        } catch {
          dispatch(gamesFailed());
        }
      },
    }),

    getGameStats: builder.query<GameStats, void>({
      query: () => `${BASE_URL_PATH}/stats`,
      providesTags: ['Stats'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        dispatch(statsLoadingStarted());
        try {
          const { data } = await queryFulfilled;
          dispatch(statsLoaded(data));
        } catch {
          dispatch(statsFailed());
        }
      },
    }),

    getGame: builder.query<UserGame, string>({
      query: (id) => `${BASE_URL_PATH}/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Game', id }],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        dispatch(selectedGameLoadingStarted());
        try {
          const { data } = await queryFulfilled;
          dispatch(selectedGameLoaded(data));
        } catch {
          dispatch(selectedGameFailed());
        }
      },
    }),

    createGame: builder.mutation<UserGame, CreateGameDto>({
      query: (body) => ({ url: BASE_URL_PATH, method: 'POST', body }),
      invalidatesTags: ['Game', 'Stats'],
    }),

    updateGame: builder.mutation<UserGame, UpdateGameArgs>({
      query: ({ id, data }) => ({ url: `${BASE_URL_PATH}/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Game', id }, 'Stats'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(selectedGamePatched(data));
        } catch {
          // leave slice state unchanged on failure — component handles toast
        }
      },
    }),

    deleteGame: builder.mutation<void, string>({
      query: (id) => ({ url: `${BASE_URL_PATH}/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Game', 'Stats'],
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(selectedGameRemoved(id));
        } catch {
          // leave slice state unchanged on failure — component handles toast
        }
      },
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
