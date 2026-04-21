import { CreateGameDto, GameStatus, Platform, RemapGameDto, SortableField, UpdateGameDto, UserGame } from '@grimoire/shared';

import type { RootState } from '@/store/store';
import {
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
  platform?: Platform;
  search?: string;
  sortBy?: SortableField;
  order?: 'asc' | 'desc';
};

export type UpdateGameArgs = {
  id: string;
  data: UpdateGameDto;
};

export type RemapGameArgs = {
  id: string;
  data: RemapGameDto;
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

    remapGame: builder.mutation<UserGame, RemapGameArgs>({
      query: ({ id, data }) => ({ url: `${BASE_URL_PATH}/${id}/remap`, method: 'PATCH', body: data }),
      // Only bust the single-item detail cache and Stats — the list is patched in-place below.
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Game', id }, 'Stats'],
      onQueryStarted: async ({ id }, { dispatch, queryFulfilled, getState }) => {
        try {
          const { data: updatedGame } = await queryFulfilled;

          // Patch every active getGames cache entry that contains the remapped game.
          const state = getState() as RootState;
          const queries = state[api.reducerPath].queries;

          for (const key of Object.keys(queries)) {
            const entry = queries[key];
            if (entry?.endpointName !== 'getGames') continue;

            const cachedGames = entry.data as UserGame[] | undefined;
            if (!cachedGames?.some((g) => g.id === id)) continue;

            dispatch(
              gamesApi.util.updateQueryData('getGames', entry.originalArgs as unknown as GamesQuery, (draft) => {
                const idx = draft.findIndex((g) => g.id === id);
                if (idx !== -1) draft[idx] = updatedGame;
              }),
            );
          }
        } catch {
          // leave caches unchanged on failure — component handles toast
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
  useRemapGameMutation,
  useCreateGameMutation,
  useUpdateGameMutation,
  useDeleteGameMutation,
} = gamesApi;
