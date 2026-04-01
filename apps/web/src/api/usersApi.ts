import { User } from '@grimoire/shared';

import { api } from './api';

export type UpdateMeArgs = {
  name?: string;
};

export type ChangePasswordArgs = {
  currentPassword: string;
  newPassword: string;
};

const BASE_URL_PATH = 'users';
export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => `${BASE_URL_PATH}/me`,
      providesTags: ['User'],
    }),

    updateMe: builder.mutation<User, UpdateMeArgs>({
      query: (body) => ({ url: `${BASE_URL_PATH}/me`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),

    changePassword: builder.mutation<void, ChangePasswordArgs>({
      query: (body) => ({ url: `${BASE_URL_PATH}/me/password`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetMeQuery, useUpdateMeMutation, useChangePasswordMutation } = usersApi;
