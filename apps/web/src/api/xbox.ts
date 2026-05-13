import { PlatformSyncStatus } from '@grimoire/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

import { gameKeys } from './games';

export type SyncXboxResponse = {
  jobId: string;
};

async function fetchXboxStatus(): Promise<PlatformSyncStatus> {
  return apiFetch<PlatformSyncStatus>('/platforms/xbox/status');
}

async function syncXbox(): Promise<SyncXboxResponse> {
  return apiFetch<SyncXboxResponse>('/platforms/xbox/sync', { method: 'POST' });
}

export function useGetXboxStatus() {
  return useQuery({
    queryKey: ['xbox', 'status'],
    queryFn: fetchXboxStatus,
  });
}

export function useSyncXbox() {
  return useMutation({
    mutationFn: syncXbox,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.list() });
    },
  });
}
