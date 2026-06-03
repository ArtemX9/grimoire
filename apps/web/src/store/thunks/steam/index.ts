import { PlatformSyncStatus, UserPlatform } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import {
  steamConnectFulfilled,
  steamConnectPending,
  steamConnectRejected,
  steamGetStatusFulfilled,
  steamGetStatusPending,
  steamGetStatusRejected,
  steamSyncFulfilled,
  steamSyncPending,
  steamSyncRejected,
} from '@/store/actions/steam';
import type { AppThunk } from '@/store/store';

import type { ConnectSteamArgs, SyncSteamResponse } from './types';

// ---------------------------------------------------------------------------
// getSteamStatus
// ---------------------------------------------------------------------------

export const getSteamStatus = (): AppThunk<Promise<PlatformSyncStatus>> => async (dispatch) => {
  dispatch(steamGetStatusPending());
  try {
    const data = await apiFetch<PlatformSyncStatus>('/platforms/steam/status');
    dispatch(steamGetStatusFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(steamGetStatusRejected(message));
    throw new Error(message);
  }
};

// ---------------------------------------------------------------------------
// connectSteam
// ---------------------------------------------------------------------------

export const connectSteam =
  (args: ConnectSteamArgs): AppThunk<Promise<UserPlatform>> =>
  async (dispatch) => {
    dispatch(steamConnectPending());
    try {
      const data = await apiFetch<UserPlatform>('/platforms/steam/connect', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      dispatch(steamConnectFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(steamConnectRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// syncSteam
// ---------------------------------------------------------------------------

export const syncSteam = (): AppThunk<Promise<SyncSteamResponse>> => async (dispatch) => {
  dispatch(steamSyncPending());
  try {
    const data = await apiFetch<SyncSteamResponse>('/platforms/steam/sync', { method: 'POST' });
    dispatch(steamSyncFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(steamSyncRejected(message));
    throw new Error(message);
  }
};
