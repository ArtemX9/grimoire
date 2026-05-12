import { useMutation, useQuery } from '@tanstack/react-query';
import { UserPlatform } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

import { userKeys } from './users';
import { gameKeys } from './games';

export type PSNSyncStatus = {
  connected: boolean;
  lastSyncAt?: string;
};

export type ConnectPSNArgs = {
  username: string;
};

async function fetchPSNStatus(): Promise<PSNSyncStatus> {
  return apiFetch<PSNSyncStatus>('/platforms/playstation/status');
}

async function connectPSN(args: ConnectPSNArgs): Promise<UserPlatform> {
  return apiFetch<UserPlatform>(`/platforms/playstation/connect?username=${encodeURIComponent(args.username)}`, {
    method: 'POST',
  });
}

async function syncPSN(): Promise<void> {
  return apiFetch<void>('/platforms/playstation/sync', { method: 'POST' });
}

export function useGetPSNStatus() {
  return useQuery({
    queryKey: ['psn', 'status'],
    queryFn: fetchPSNStatus,
  });
}

export function useConnectPSN() {
  return useMutation({
    mutationFn: connectPSN,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psn', 'status'] });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}

export function useSyncPSN() {
  return useMutation({
    mutationFn: syncPSN,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.list() });
    },
  });
}
