import { UserPlatform } from '@grimoire/shared';

import { api } from './api';

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

const BASE_URL_PATH = 'platforms/steam';
export const steamApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSteamStatus: builder.query<SteamSyncStatus, void>({
      query: () => `${BASE_URL_PATH}/status`,
      providesTags: ['User'],
    }),

    connectSteam: builder.mutation<UserPlatform, ConnectSteamArgs>({
      query: (body) => ({ url: `${BASE_URL_PATH}/connect`, method: 'POST', body }),
      invalidatesTags: ['User'],
    }),

    syncSteam: builder.mutation<SyncSteamResponse, void>({
      query: () => ({ url: `${BASE_URL_PATH}/sync`, method: 'POST' }),
      invalidatesTags: ['Game', 'Stats'],
    }),
  }),
});

export const { useGetSteamStatusQuery, useConnectSteamMutation, useSyncSteamMutation } = steamApi;
