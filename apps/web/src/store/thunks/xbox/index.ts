import { PlatformSyncStatus } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import {
  xboxGetStatusFulfilled,
  xboxGetStatusPending,
  xboxGetStatusRejected,
  xboxSyncFulfilled,
  xboxSyncPending,
  xboxSyncRejected,
} from '@/store/actions/xbox';
import type { AppThunk } from '@/store/store';

import type { SyncXboxResponse } from './types';

// ---------------------------------------------------------------------------
// getXboxStatus
// ---------------------------------------------------------------------------

export const getXboxStatus = (): AppThunk<Promise<PlatformSyncStatus>> => async (dispatch) => {
  dispatch(xboxGetStatusPending());
  try {
    const data = await apiFetch<PlatformSyncStatus>('/platforms/xbox/status');
    dispatch(xboxGetStatusFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(xboxGetStatusRejected(message));
    throw new Error(message);
  }
};

// ---------------------------------------------------------------------------
// syncXbox
// ---------------------------------------------------------------------------

export const syncXbox = (): AppThunk<Promise<SyncXboxResponse>> => async (dispatch) => {
  dispatch(xboxSyncPending());
  try {
    const data = await apiFetch<SyncXboxResponse>('/platforms/xbox/sync', { method: 'POST' });
    dispatch(xboxSyncFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(xboxSyncRejected(message));
    throw new Error(message);
  }
};
