import { UserPlatform } from '@grimoire/shared';

import { api } from './api';

export type XboxSyncStatus = {
  connected: boolean;
  lastSyncAt?: string;
  platform?: UserPlatform;
};

const BASE = 'platforms/xbox';

export const xboxApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getXboxStatus: builder.query<XboxSyncStatus, void>({
      query: () => `${BASE}/status`,
      providesTags: ['User'],
    }),
    connectXbox: builder.mutation<UserPlatform, { gamertag: string }>({
      query: (body) => ({ url: `${BASE}/connect`, method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    syncXbox: builder.mutation<{ queued: boolean }, void>({
      query: () => ({ url: `${BASE}/sync`, method: 'POST' }),
      invalidatesTags: ['Game', 'Stats'],
    }),
  }),
});

export const { useGetXboxStatusQuery, useConnectXboxMutation, useSyncXboxMutation } = xboxApi;
