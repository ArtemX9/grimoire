import { UserPlatform } from '@grimoire/shared';

import { api } from './api';

export type PsnSyncStatus = {
  connected: boolean;
  lastSyncAt?: string;
  platform?: UserPlatform;
};

const BASE = 'platforms/psn';

export const psnApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPsnStatus: builder.query<PsnSyncStatus, void>({
      query: () => `${BASE}/status`,
      providesTags: ['User'],
    }),
    connectPsn: builder.mutation<UserPlatform, { psnUsername: string }>({
      query: (body) => ({ url: `${BASE}/connect`, method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    syncPsn: builder.mutation<{ queued: boolean }, void>({
      query: () => ({ url: `${BASE}/sync`, method: 'POST' }),
      invalidatesTags: ['Game', 'Stats'],
    }),
  }),
});

export const { useGetPsnStatusQuery, useConnectPsnMutation, useSyncPsnMutation } = psnApi;
