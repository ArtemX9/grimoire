import { User } from '@grimoire/shared';

import { api } from '@/app/api';

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => 'users/me',
      providesTags: ['User'],
    }),

    updateMe: builder.mutation<User, { name?: string }>({
      query: (body) => ({ url: 'users/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetMeQuery, useUpdateMeMutation } = usersApi;
