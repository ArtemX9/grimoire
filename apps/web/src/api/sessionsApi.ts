import { CreateSessionDto, PlaySession } from '@grimoire/shared';

import { api } from './api';

export const sessionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRecentSessions: builder.query<PlaySession[], number | void>({
      query: (limit = 10) => ({ url: 'sessions/recent', params: { limit } }),
      providesTags: ['Session'],
    }),

    getGameSessions: builder.query<PlaySession[], string>({
      query: (gameId) => `sessions/game/${gameId}`,
      providesTags: (_r, _e, gameId) => [{ type: 'Session', id: gameId }],
    }),

    createSession: builder.mutation<PlaySession, CreateSessionDto>({
      query: (body) => ({ url: 'sessions', method: 'POST', body }),
      invalidatesTags: ['Session', 'Game', 'Stats'],
    }),
  }),
});

export const { useGetRecentSessionsQuery, useGetGameSessionsQuery, useCreateSessionMutation } = sessionsApi;
