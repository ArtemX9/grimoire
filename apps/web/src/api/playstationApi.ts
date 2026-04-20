import { UserPlatform } from '@grimoire/shared';

import { api } from './api';

export type PSNSyncStatus = {
  connected: boolean;
  lastSyncAt?: string;
};

export type ConnectPSNArgs = {
  username: string;
};

const BASE_URL_PATH = 'platforms/playstation';

export const playstationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPSNStatus: builder.query<PSNSyncStatus, void>({
      query: () => `${BASE_URL_PATH}/status`,
      providesTags: ['User'],
    }),

    connectPSN: builder.mutation<UserPlatform, ConnectPSNArgs>({
      query: ({ username }) => ({
        url: `${BASE_URL_PATH}/connect?username=${encodeURIComponent(username)}`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    syncPSN: builder.mutation<void, void>({
      query: () => ({ url: `${BASE_URL_PATH}/sync`, method: 'POST' }),
      invalidatesTags: ['Game'],
    }),
  }),
});

export const { useGetPSNStatusQuery, useConnectPSNMutation, useSyncPSNMutation } = playstationApi;
