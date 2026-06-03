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

export const xboxGetStatusPending = () => ({ type: XBOX_GET_STATUS_PENDING }) as const;
export const xboxGetStatusFulfilled = (payload: PlatformSyncStatus) => ({ type: XBOX_GET_STATUS_FULFILLED, payload }) as const;
export const xboxGetStatusRejected = (error: string) => ({ type: XBOX_GET_STATUS_REJECTED, error }) as const;

export const xboxSyncPending = () => ({ type: XBOX_SYNC_PENDING }) as const;
export const xboxSyncFulfilled = (payload: SyncXboxResponse) => ({ type: XBOX_SYNC_FULFILLED, payload }) as const;
export const xboxSyncRejected = (error: string) => ({ type: XBOX_SYNC_REJECTED, error }) as const;

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
