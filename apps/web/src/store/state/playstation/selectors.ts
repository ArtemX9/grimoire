import { AsyncStatus } from '@grimoire/shared';
import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectPSNStatus = (state: RootState) => state.playstation.status;
export const selectPSNFetchStatus = (state: RootState) => state.playstation.fetchStatus;
export const selectPSNConnectStatus = (state: RootState) => state.playstation.connectStatus;
export const selectPSNSyncStatus = (state: RootState) => state.playstation.syncStatus;
export const selectPSNError = (state: RootState) => state.playstation.error;

export const selectIsPSNConnected = createSelector(selectPSNStatus, (status) => !!status?.connected);

export const selectIsPSNConnecting = createSelector(selectPSNConnectStatus, (connectStatus) => connectStatus === AsyncStatus.Loading);

export const selectIsPSNSyncing = createSelector(selectPSNSyncStatus, (syncStatus) => syncStatus === AsyncStatus.Loading);
