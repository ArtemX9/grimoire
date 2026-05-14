import { Role } from '@grimoire/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

import { userKeys } from './users';

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

export type UpdateUserRoleArgs = {
  userID: string;
  role: Role;
};

export type SetupAdminArgs = {
  email: string;
  password: string;
  name?: string;
};

export const adminKeys = {
  users: () => ['admin', 'users'] as const,
  stats: () => ['admin', 'stats'] as const,
  aiSettings: () => ['admin', 'settings', 'ai'] as const,
};

async function fetchAdminUsers(): Promise<AdminUserListResponse> {
  return apiFetch<AdminUserListResponse>('/admin/users');
}

async function createAdminUser(body: CreateUserArgs): Promise<AdminUserRow> {
  return apiFetch<AdminUserRow>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function deleteAdminUser(id: string): Promise<void> {
  return apiFetch<void>(`/admin/users/${id}`, { method: 'DELETE' });
}

async function fetchAiGlobalSettings(): Promise<AiGlobalSettings> {
  return apiFetch<AiGlobalSettings>('/admin/settings/ai');
}

async function updateAiGlobalSettings(body: UpdateAiGlobalArgs): Promise<void> {
  return apiFetch<void>('/admin/settings/ai', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

async function updateUserAiSettings({ id, ...body }: UpdateUserAiArgs): Promise<void> {
  return apiFetch<void>(`/admin/users/${id}/ai`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/admin/stats');
}

async function updateUserPlan({ id, plan }: UpdateUserPlanArgs): Promise<AdminUserRow> {
  return apiFetch<AdminUserRow>(`/admin/users/${id}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
}

async function updateUserRole({ userID, role }: UpdateUserRoleArgs): Promise<AdminUserRow> {
  return apiFetch<AdminUserRow>(`/admin/users/${userID}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

async function setupAdmin(body: SetupAdminArgs): Promise<AdminUserRow> {
  return apiFetch<AdminUserRow>('/admin/setup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function useListAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: fetchAdminUsers,
    select: (data) => data,
  });
}

export function useGetAiGlobalSettings() {
  return useQuery({
    queryKey: adminKeys.aiSettings(),
    queryFn: fetchAiGlobalSettings,
  });
}

export function useGetAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: fetchAdminStats,
  });
}

export function useCreateAdminUser() {
  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: (newUser) => {
      queryClient.setQueryData(adminKeys.users(), (old: AdminUserListResponse | undefined) => {
        if (!old) return { data: [newUser], total: 1 };
        return { data: [newUser, ...old.data], total: old.total + 1 };
      });
    },
  });
}

export function useDeleteAdminUser() {
  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: (_void, id) => {
      queryClient.setQueryData(adminKeys.users(), (old: AdminUserListResponse | undefined) => {
        if (!old) return old;
        return { data: old.data.filter((u) => u.id !== id), total: Math.max(0, old.total - 1) };
      });
    },
  });
}

export function useUpdateAiGlobalSettings() {
  return useMutation({
    mutationFn: updateAiGlobalSettings,
    onSuccess: (_void, args) => {
      queryClient.setQueryData(adminKeys.aiSettings(), (old: AiGlobalSettings | undefined) => {
        return { ...(old ?? {}), aiEnabled: args.aiEnabled };
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}

export function useUpdateUserAiSettings() {
  return useMutation({
    mutationFn: updateUserAiSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useUpdateUserPlan() {
  return useMutation({
    mutationFn: updateUserPlan,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(adminKeys.users(), (old: AdminUserListResponse | undefined) => {
        if (!old) return old;
        return { ...old, data: old.data.map((u) => (u.id === updatedUser.id ? updatedUser : u)) };
      });
    },
  });
}

export function useUpdateUserRole() {
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(adminKeys.users(), (old: AdminUserListResponse | undefined) => {
        if (!old) return old;
        return { ...old, data: old.data.map((u) => (u.id === updatedUser.id ? updatedUser : u)) };
      });
    },
  });
}

export function useSetupAdmin() {
  return useMutation({
    mutationFn: setupAdmin,
  });
}
