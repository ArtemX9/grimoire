import { PlatformSyncStatus, UserPlatform } from '@grimoire/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

import { gameKeys } from './games';
import { userKeys } from './users';

export type ConnectPSNArgs = {
  username: string;
};

async function fetchPSNStatus(): Promise<PlatformSyncStatus> {
  return apiFetch<PlatformSyncStatus>('/platforms/playstation/status');
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
