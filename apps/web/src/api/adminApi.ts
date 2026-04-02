import { Role } from '@grimoire/shared';

import {
  aiSettingsFailed,
  aiSettingsLoaded,
  aiSettingsLoadingStarted,
  aiSettingsPatched,
  statsFailed,
  statsLoaded,
  statsLoadingStarted,
  userAdded,
  userPatched,
  userRemoved,
  usersFailed,
  usersLoaded,
  usersLoadingStarted,
} from '@/store/adminSlice';

import { api } from './api';

export type AdminUserRow = {
  id: string;
  email: string;
  name?: string;
  role: Role;
  plan: string;
  mustChangePassword: boolean;
  aiEnabled: boolean;
  aiRequestsUsed: number;
  aiRequestsLimit: number | null;
  gamesCount: number;
  createdAt: string;
};

export type AdminUserListResponse = {
  data: AdminUserRow[];
  total: number;
};

export type AiGlobalSettings = {
  aiEnabled: boolean;
};

export type AdminStats = {
  users: Array<{
    id: string;
    email: string;
    name?: string;
    gamesCount: number;
    sessionsCount: number;
    aiRequestsUsed: number;
    aiRequestsLimit: number | null;
  }>;
};

export type CreateUserArgs = {
  email: string;
  password: string;
  name?: string;
};

export type UpdateUserAiArgs = {
  id: string;
  aiEnabled: boolean;
  aiRequestsLimit: number | null;
};

export type UpdateAiGlobalArgs = {
  aiEnabled: boolean;
};

export type UpdateUserPlanArgs = {
  id: string;
  plan: string;
};

export type SetupAdminArgs = {
  email: string;
  password: string;
  name?: string;
};

const BASE_URL_PATH = 'admin';

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAdminUsers: builder.query<AdminUserListResponse, void>({
      query: () => `${BASE_URL_PATH}/users`,
      providesTags: ['AdminUser'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        dispatch(usersLoadingStarted());
        try {
          const { data } = await queryFulfilled;
          dispatch(usersLoaded(data));
        } catch {
          dispatch(usersFailed());
        }
      },
    }),

    createAdminUser: builder.mutation<AdminUserRow, CreateUserArgs>({
      query: (body) => ({ url: `${BASE_URL_PATH}/users`, method: 'POST', body }),
      invalidatesTags: ['AdminUser'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(userAdded(data));
        } catch {
          // leave slice state unchanged — component handles the error toast
        }
      },
    }),

    deleteAdminUser: builder.mutation<void, string>({
      query: (id) => ({ url: `${BASE_URL_PATH}/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminUser'],
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(userRemoved(id));
        } catch {
          // leave slice state unchanged — component handles the error toast
        }
      },
    }),

    getAiGlobalSettings: builder.query<AiGlobalSettings, void>({
      query: () => `${BASE_URL_PATH}/settings/ai`,
      providesTags: ['AdminUser'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        dispatch(aiSettingsLoadingStarted());
        try {
          const { data } = await queryFulfilled;
          dispatch(aiSettingsLoaded(data));
        } catch {
          dispatch(aiSettingsFailed());
        }
      },
    }),

    updateAiGlobalSettings: builder.mutation<void, UpdateAiGlobalArgs>({
      query: (body) => ({ url: `${BASE_URL_PATH}/settings/ai`, method: 'PATCH', body }),
      invalidatesTags: ['AdminUser', 'User'],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(aiSettingsPatched({ aiEnabled: arg.aiEnabled }));
        } catch {
          // leave slice state unchanged — component handles the error toast
        }
      },
    }),

    updateUserAiSettings: builder.mutation<void, UpdateUserAiArgs>({
      query: ({ id, ...body }) => ({ url: `${BASE_URL_PATH}/users/${id}/ai`, method: 'PATCH', body }),
      invalidatesTags: ['AdminUser'],
    }),

    getAdminStats: builder.query<AdminStats, void>({
      query: () => `${BASE_URL_PATH}/stats`,
      providesTags: ['AdminUser'],
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

    updateUserPlan: builder.mutation<AdminUserRow, UpdateUserPlanArgs>({
      query: ({ id, plan }) => ({ url: `${BASE_URL_PATH}/users/${id}/plan`, method: 'PATCH', body: { plan } }),
      invalidatesTags: ['AdminUser'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(userPatched(data));
        } catch {
          // leave slice state unchanged — component handles the error toast
        }
      },
    }),

    setupAdmin: builder.mutation<AdminUserRow, SetupAdminArgs>({
      query: (body) => ({ url: `${BASE_URL_PATH}/setup`, method: 'POST', body }),
    }),
  }),
});

export const {
  useListAdminUsersQuery,
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAiGlobalSettingsQuery,
  useUpdateAiGlobalSettingsMutation,
  useUpdateUserAiSettingsMutation,
  useUpdateUserPlanMutation,
  useGetAdminStatsQuery,
  useSetupAdminMutation,
} = adminApi;
