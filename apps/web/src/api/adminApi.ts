import { Role } from '@grimoire/shared';

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
    }),

    createAdminUser: builder.mutation<AdminUserRow, CreateUserArgs>({
      query: (body) => ({ url: `${BASE_URL_PATH}/users`, method: 'POST', body }),
      invalidatesTags: ['AdminUser'],
    }),

    deleteAdminUser: builder.mutation<void, string>({
      query: (id) => ({ url: `${BASE_URL_PATH}/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminUser'],
    }),

    getAiGlobalSettings: builder.query<AiGlobalSettings, void>({
      query: () => `${BASE_URL_PATH}/settings/ai`,
      providesTags: ['AdminUser'],
    }),

    updateAiGlobalSettings: builder.mutation<void, UpdateAiGlobalArgs>({
      query: (body) => ({ url: `${BASE_URL_PATH}/settings/ai`, method: 'PATCH', body }),
      invalidatesTags: ['AdminUser', 'User'],
    }),

    updateUserAiSettings: builder.mutation<void, UpdateUserAiArgs>({
      query: ({ id, ...body }) => ({ url: `${BASE_URL_PATH}/users/${id}/ai`, method: 'PATCH', body }),
      invalidatesTags: ['AdminUser'],
    }),

    getAdminStats: builder.query<AdminStats, void>({
      query: () => `${BASE_URL_PATH}/stats`,
      providesTags: ['AdminUser'],
    }),

    updateUserPlan: builder.mutation<AdminUserRow, UpdateUserPlanArgs>({
      query: ({ id, plan }) => ({ url: `${BASE_URL_PATH}/users/${id}/plan`, method: 'PATCH', body: { plan } }),
      invalidatesTags: ['AdminUser'],
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
