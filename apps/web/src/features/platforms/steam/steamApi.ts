import { UserPlatform } from '@grimoire/shared';

import { api } from '@/app/api';

interface SteamSyncStatus {
  connected: boolean;
  lastSyncAt?: string;
  platform?: UserPlatform;
}

export const steamApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSteamStatus: builder.query<SteamSyncStatus, void>({
      query: () => 'platforms/steam/status',
      providesTags: ['User'],
    }),

    connectSteam: builder.mutation<UserPlatform, { steamId: string }>({
      query: (body) => ({ url: 'platforms/steam/connect', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),

    syncSteam: builder.mutation<{ jobId: string }, void>({
      query: () => ({ url: 'platforms/steam/sync', method: 'POST' }),
      invalidatesTags: ['Game', 'Stats'],
    }),
  }),
});

export const { useGetSteamStatusQuery, useConnectSteamMutation, useSyncSteamMutation } = steamApi;
