import { useMutation, useQuery } from '@tanstack/react-query';
import { UserPlatform } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

import { userKeys } from './users';
import { gameKeys } from './games';

export type SteamSyncStatus = {
  connected: boolean;
  lastSyncAt?: string;
  platform?: UserPlatform;
};

export type ConnectSteamArgs = {
  steamId: string;
};

export type SyncSteamResponse = {
  jobId: string;
};

async function fetchSteamStatus(): Promise<SteamSyncStatus> {
  return apiFetch<SteamSyncStatus>('/platforms/steam/status');
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
