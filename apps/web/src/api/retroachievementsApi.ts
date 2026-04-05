import { UserPlatform } from '@grimoire/shared';

import { api } from './api';

export type RaSyncStatus = {
  connected: boolean;
  lastSyncAt?: string;
  platform?: UserPlatform;
};

const BASE = 'platforms/retroachievements';

export const retroachievementsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRaStatus: builder.query<RaSyncStatus, void>({
      query: () => `${BASE}/status`,
      providesTags: ['User'],
    }),
    connectRa: builder.mutation<UserPlatform, { raUsername: string }>({
      query: (body) => ({ url: `${BASE}/connect`, method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    syncRa: builder.mutation<{ queued: boolean }, void>({
      query: () => ({ url: `${BASE}/sync`, method: 'POST' }),
      invalidatesTags: ['Game', 'Stats'],
    }),
  }),
});

export const { useGetRaStatusQuery, useConnectRaMutation, useSyncRaMutation } = retroachievementsApi;
