import { Role } from '@grimoire/shared';

import { api } from '@/app/api';

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    mustChangePassword: boolean;
    aiEnabled: boolean;
    aiRequestsLimit: number | null;
  };
}

interface SignInArgs {
  email: string;
  password: string;
}

interface ChangePasswordArgs {
  currentPassword: string;
  newPassword: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSession: builder.query<Session | null, void>({
      query: () => 'auth/get-session',
      providesTags: ['User'],
    }),

    signIn: builder.mutation<Session, SignInArgs>({
      query: (body) => ({
        url: 'auth/sign-in/email',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    signOut: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/sign-out',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Game', 'Session', 'Stats'],
    }),

    changePassword: builder.mutation<void, ChangePasswordArgs>({
      query: (body) => ({
        url: 'users/me/password',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetSessionQuery, useSignInMutation, useSignOutMutation, useChangePasswordMutation } = authApi;
