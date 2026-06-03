import { PlatformSyncStatus, UserPlatform } from '@grimoire/shared';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const PSN_GET_STATUS_PENDING = 'playstation/getStatus/pending';
export const PSN_GET_STATUS_FULFILLED = 'playstation/getStatus/fulfilled';
export const PSN_GET_STATUS_REJECTED = 'playstation/getStatus/rejected';

export const PSN_CONNECT_PENDING = 'playstation/connect/pending';
export const PSN_CONNECT_FULFILLED = 'playstation/connect/fulfilled';
export const PSN_CONNECT_REJECTED = 'playstation/connect/rejected';

export const PSN_SYNC_PENDING = 'playstation/sync/pending';
export const PSN_SYNC_FULFILLED = 'playstation/sync/fulfilled';
export const PSN_SYNC_REJECTED = 'playstation/sync/rejected';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const psnGetStatusPending = () => ({ type: PSN_GET_STATUS_PENDING }) as const;
export const psnGetStatusFulfilled = (payload: PlatformSyncStatus) => ({ type: PSN_GET_STATUS_FULFILLED, payload }) as const;
export const psnGetStatusRejected = (error: string) => ({ type: PSN_GET_STATUS_REJECTED, error }) as const;

export const psnConnectPending = () => ({ type: PSN_CONNECT_PENDING }) as const;
export const psnConnectFulfilled = (payload: UserPlatform) => ({ type: PSN_CONNECT_FULFILLED, payload }) as const;
export const psnConnectRejected = (error: string) => ({ type: PSN_CONNECT_REJECTED, error }) as const;

export const psnSyncPending = () => ({ type: PSN_SYNC_PENDING }) as const;
export const psnSyncFulfilled = () => ({ type: PSN_SYNC_FULFILLED }) as const;
export const psnSyncRejected = (error: string) => ({ type: PSN_SYNC_REJECTED, error }) as const;

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type PlaystationAction =
  | ReturnType<typeof psnGetStatusPending>
  | ReturnType<typeof psnGetStatusFulfilled>
  | ReturnType<typeof psnGetStatusRejected>
  | ReturnType<typeof psnConnectPending>
  | ReturnType<typeof psnConnectFulfilled>
  | ReturnType<typeof psnConnectRejected>
  | ReturnType<typeof psnSyncPending>
  | ReturnType<typeof psnSyncFulfilled>
  | ReturnType<typeof psnSyncRejected>;
