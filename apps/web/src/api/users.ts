import { useMutation, useQuery } from '@tanstack/react-query';
import { User } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

export type UpdateMeArgs = {
  name?: string;
};

export type ChangePasswordArgs = {
  currentPassword: string;
  newPassword: string;
};

export const userKeys = {
  me: () => ['users', 'me'] as const,
};

async function fetchMe(): Promise<User> {
  return apiFetch<User>('/users/me');
}

async function updateMe(args: UpdateMeArgs): Promise<User> {
  return apiFetch<User>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(args),
  });
}

async function changePassword(args: ChangePasswordArgs): Promise<void> {
  return apiFetch<void>('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify(args),
  });
}

export function useGetMe() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: fetchMe,
  });
}

export function useUpdateMe() {
  return useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}
