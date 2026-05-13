import { PlatformSyncStatus, UserPlatform } from '@grimoire/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

import { gameKeys } from './games';
import { userKeys } from './users';

export type ConnectSteamArgs = {
  steamId: string;
};

export type SyncSteamResponse = {
  jobId: string;
};

async function fetchSteamStatus(): Promise<PlatformSyncStatus> {
  return apiFetch<PlatformSyncStatus>('/platforms/steam/status');
}

async function connectSteam(args: ConnectSteamArgs): Promise<UserPlatform> {
  return apiFetch<UserPlatform>('/platforms/steam/connect', {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

async function syncSteam(): Promise<SyncSteamResponse> {
  return apiFetch<SyncSteamResponse>('/platforms/steam/sync', { method: 'POST' });
}

export function useGetSteamStatus() {
  return useQuery({
    queryKey: ['steam', 'status'],
    queryFn: fetchSteamStatus,
  });
}

export function useConnectSteam() {
  return useMutation({
    mutationFn: connectSteam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steam', 'status'] });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}

export function useSyncSteam() {
  return useMutation({
    mutationFn: syncSteam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.list() });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}
