import { Role } from '@grimoire/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

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

export const authKeys = {
  session: () => ['auth', 'session'] as const,
};

async function fetchSession(): Promise<Session | null> {
  return apiFetch<Session | null>('/auth/get-session');
}

async function signIn(args: SignInArgs): Promise<Session> {
  return apiFetch<Session>('/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

async function signOut(): Promise<void> {
  return apiFetch<void>('/auth/sign-out', { method: 'POST' });
}

export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: fetchSession,
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: signIn,
    onSuccess: (result) => {
      queryClient.setQueryData(authKeys.session(), result);
    },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.removeQueries();
      queryClient.setQueryData(authKeys.session(), null);
    },
  });
}
