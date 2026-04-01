import { Role } from '@grimoire/shared';

import { sessionCleared, sessionLoaded } from '@/store/authSlice';

import { api } from './api';

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    mustChangePassword: boolean;
    aiEnabled: boolean;
    aiRequestsLimit: number | null;
  };
};

export type SignInArgs = {
  email: string;
  password: string;
};

const BASE_URL_PATH = 'auth';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSession: builder.query<Session | null, void>({
      query: () => `${BASE_URL_PATH}/get-session`,
      providesTags: ['User'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionLoaded(data));
        } catch {
          dispatch(sessionLoaded(null));
        }
      },
    }),

    signIn: builder.mutation<Session, SignInArgs>({
      query: (body) => ({ url: `${BASE_URL_PATH}/sign-in/email`, method: 'POST', body }),
      invalidatesTags: ['User'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(sessionLoaded(data));
      },
    }),

    signOut: builder.mutation<void, void>({
      query: () => ({ url: `${BASE_URL_PATH}/sign-out`, method: 'POST' }),
      invalidatesTags: ['User', 'Game', 'Session', 'Stats'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        await queryFulfilled;
        dispatch(sessionCleared());
      },
    }),
  }),
});

export const { useGetSessionQuery, useSignInMutation, useSignOutMutation } = authApi;
