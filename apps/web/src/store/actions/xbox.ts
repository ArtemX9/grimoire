import { PlatformSyncStatus } from '@grimoire/shared';

import type { SyncXboxResponse } from '@/store/thunks/xbox/types';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const XBOX_GET_STATUS_PENDING = 'xbox/getStatus/pending';
export const XBOX_GET_STATUS_FULFILLED = 'xbox/getStatus/fulfilled';
export const XBOX_GET_STATUS_REJECTED = 'xbox/getStatus/rejected';

export const XBOX_SYNC_PENDING = 'xbox/sync/pending';
export const XBOX_SYNC_FULFILLED = 'xbox/sync/fulfilled';
export const XBOX_SYNC_REJECTED = 'xbox/sync/rejected';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const xboxGetStatusPending = () => ({ type: XBOX_GET_STATUS_PENDING, payload: {} });
export const xboxGetStatusFulfilled = (syncStatus: PlatformSyncStatus) => ({ type: XBOX_GET_STATUS_FULFILLED, payload: { syncStatus } });
export const xboxGetStatusRejected = (error: string) => ({ type: XBOX_GET_STATUS_REJECTED, payload: { error } });

export const xboxSyncPending = () => ({ type: XBOX_SYNC_PENDING, payload: {} });
export const xboxSyncFulfilled = (syncResponse: SyncXboxResponse) => ({ type: XBOX_SYNC_FULFILLED, payload: { syncResponse } });
export const xboxSyncRejected = (error: string) => ({ type: XBOX_SYNC_REJECTED, payload: { error } });

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type XboxAction =
  | ReturnType<typeof xboxGetStatusPending>
  | ReturnType<typeof xboxGetStatusFulfilled>
  | ReturnType<typeof xboxGetStatusRejected>
  | ReturnType<typeof xboxSyncPending>
  | ReturnType<typeof xboxSyncFulfilled>
  | ReturnType<typeof xboxSyncRejected>;
