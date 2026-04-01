import { Role } from '@grimoire/shared';

import { api } from '@/api/api';

export interface AdminUserRow {
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
}

export interface AdminUserListResponse {
  data: AdminUserRow[];
  total: number;
}

export interface AiGlobalSettings {
  aiEnabled: boolean;
}

export interface AdminStats {
  users: Array<{
    id: string;
    email: string;
    name?: string;
    gamesCount: number;
    sessionsCount: number;
    aiRequestsUsed: number;
    aiRequestsLimit: number | null;
  }>;
}

export interface CreateUserArgs {
  email: string;
  password: string;
  name?: string;
}

export interface UpdateUserAiArgs {
  id: string;
  aiEnabled: boolean;
  aiRequestsLimit: number | null;
}

export interface UpdateAiGlobalArgs {
  aiEnabled: boolean;
}

export interface UpdateUserPlanArgs {
  id: string;
  plan: string;
}

export interface SetupAdminArgs {
  email: string;
  password: string;
  name?: string;
}

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAdminUsers: builder.query<AdminUserListResponse, void>({
      query: () => 'admin/users',
      providesTags: ['AdminUser'],
    }),

    createAdminUser: builder.mutation<AdminUserRow, CreateUserArgs>({
      query: (body) => ({ url: 'admin/users', method: 'POST', body }),
      invalidatesTags: ['AdminUser'],
    }),

    deleteAdminUser: builder.mutation<void, string>({
      query: (id) => ({ url: `admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminUser'],
    }),

    getAiGlobalSettings: builder.query<AiGlobalSettings, void>({
      query: () => 'admin/settings/ai',
      providesTags: ['AdminUser'],
    }),

    updateAiGlobalSettings: builder.mutation<void, UpdateAiGlobalArgs>({
      query: (body) => ({ url: 'admin/settings/ai', method: 'PATCH', body }),
      invalidatesTags: ['AdminUser', 'User'],
    }),

    updateUserAiSettings: builder.mutation<void, UpdateUserAiArgs>({
      query: ({ id, ...body }) => ({ url: `admin/users/${id}/ai`, method: 'PATCH', body }),
      invalidatesTags: ['AdminUser'],
    }),

    getAdminStats: builder.query<AdminStats, void>({
      query: () => 'admin/stats',
      providesTags: ['AdminUser'],
    }),

    updateUserPlan: builder.mutation<AdminUserRow, UpdateUserPlanArgs>({
      query: ({ id, plan }) => ({ url: `admin/users/${id}/plan`, method: 'PATCH', body: { plan } }),
      invalidatesTags: ['AdminUser'],
    }),

    setupAdmin: builder.mutation<AdminUserRow, SetupAdminArgs>({
      query: (body) => ({ url: 'admin/setup', method: 'POST', body }),
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
