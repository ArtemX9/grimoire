import { PlatformSyncStatus, UserPlatform } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import {
  psnConnectFulfilled,
  psnConnectPending,
  psnConnectRejected,
  psnGetStatusFulfilled,
  psnGetStatusPending,
  psnGetStatusRejected,
  psnSyncFulfilled,
  psnSyncPending,
  psnSyncRejected,
} from '@/store/actions/playstation';
import type { AppThunk } from '@/store/store';

import type { ConnectPSNArgs } from './types';

// ---------------------------------------------------------------------------
// getPSNStatus
// ---------------------------------------------------------------------------

export const getPSNStatus = (): AppThunk<Promise<PlatformSyncStatus>> => async (dispatch) => {
  dispatch(psnGetStatusPending());
  try {
    const data = await apiFetch<PlatformSyncStatus>('/platforms/playstation/status');
    dispatch(psnGetStatusFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(psnGetStatusRejected(message));
    throw new Error(message);
  }
};

// ---------------------------------------------------------------------------
// connectPSN
// ---------------------------------------------------------------------------

export const connectPSN =
  (args: ConnectPSNArgs): AppThunk<Promise<UserPlatform>> =>
  async (dispatch) => {
    dispatch(psnConnectPending());
    try {
      const data = await apiFetch<UserPlatform>(`/platforms/playstation/connect?username=${encodeURIComponent(args.username)}`, {
        method: 'POST',
      });
      dispatch(psnConnectFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(psnConnectRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// syncPSN
// ---------------------------------------------------------------------------

export const syncPSN = (): AppThunk<Promise<void>> => async (dispatch) => {
  dispatch(psnSyncPending());
  try {
    await apiFetch<void>('/platforms/playstation/sync', { method: 'POST' });
    dispatch(psnSyncFulfilled());
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(psnSyncRejected(message));
    throw new Error(message);
  }
};
