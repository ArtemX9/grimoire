import { AsyncStatus } from '@grimoire/shared';
import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectXboxStatus = (state: RootState) => state.xbox.status;
export const selectXboxFetchStatus = (state: RootState) => state.xbox.fetchStatus;
export const selectXboxSyncStatus = (state: RootState) => state.xbox.syncStatus;
export const selectXboxError = (state: RootState) => state.xbox.error;

export const selectIsXboxConnected = createSelector(selectXboxStatus, (status) => !!status?.connected);

export const selectIsXboxSyncing = createSelector(selectXboxSyncStatus, (syncStatus) => syncStatus === AsyncStatus.Loading);
