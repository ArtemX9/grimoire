import { PlatformSyncStatus, UserPlatform } from '@grimoire/shared';

import type { SyncSteamResponse } from '@/store/thunks/steam/types';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const STEAM_GET_STATUS_PENDING = 'steam/getStatus/pending';
export const STEAM_GET_STATUS_FULFILLED = 'steam/getStatus/fulfilled';
export const STEAM_GET_STATUS_REJECTED = 'steam/getStatus/rejected';

export const STEAM_CONNECT_PENDING = 'steam/connect/pending';
export const STEAM_CONNECT_FULFILLED = 'steam/connect/fulfilled';
export const STEAM_CONNECT_REJECTED = 'steam/connect/rejected';

export const STEAM_SYNC_PENDING = 'steam/sync/pending';
export const STEAM_SYNC_FULFILLED = 'steam/sync/fulfilled';
export const STEAM_SYNC_REJECTED = 'steam/sync/rejected';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const steamGetStatusPending = () => ({ type: STEAM_GET_STATUS_PENDING, payload: {} });
export const steamGetStatusFulfilled = (syncStatus: PlatformSyncStatus) => ({ type: STEAM_GET_STATUS_FULFILLED, payload: { syncStatus } });
export const steamGetStatusRejected = (error: string) => ({ type: STEAM_GET_STATUS_REJECTED, payload: { error } });

export const steamConnectPending = () => ({ type: STEAM_CONNECT_PENDING, payload: {} });
export const steamConnectFulfilled = (userPlatform: UserPlatform) => ({ type: STEAM_CONNECT_FULFILLED, payload: { userPlatform } });
export const steamConnectRejected = (error: string) => ({ type: STEAM_CONNECT_REJECTED, payload: { error } });

export const steamSyncPending = () => ({ type: STEAM_SYNC_PENDING, payload: {} });
export const steamSyncFulfilled = (syncResponse: SyncSteamResponse) => ({ type: STEAM_SYNC_FULFILLED, payload: { syncResponse } });
export const steamSyncRejected = (error: string) => ({ type: STEAM_SYNC_REJECTED, payload: { error } });

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type SteamAction =
  | ReturnType<typeof steamGetStatusPending>
  | ReturnType<typeof steamGetStatusFulfilled>
  | ReturnType<typeof steamGetStatusRejected>
  | ReturnType<typeof steamConnectPending>
  | ReturnType<typeof steamConnectFulfilled>
  | ReturnType<typeof steamConnectRejected>
  | ReturnType<typeof steamSyncPending>
  | ReturnType<typeof steamSyncFulfilled>
  | ReturnType<typeof steamSyncRejected>;
