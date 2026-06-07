import { AsyncStatus } from '@grimoire/shared';
import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectSteamStatus = (state: RootState) => state.steam.status;
export const selectSteamFetchStatus = (state: RootState) => state.steam.fetchStatus;
export const selectSteamConnectStatus = (state: RootState) => state.steam.connectStatus;
export const selectSteamSyncStatus = (state: RootState) => state.steam.syncStatus;
export const selectSteamError = (state: RootState) => state.steam.error;

export const selectIsSteamConnected = createSelector(selectSteamStatus, (status) => status?.connected ?? false);

export const selectIsSteamFetching = createSelector(selectSteamFetchStatus, (fetchStatus) => fetchStatus === AsyncStatus.Loading);

export const selectIsSteamSyncing = createSelector(selectSteamSyncStatus, (syncStatus) => syncStatus === AsyncStatus.Loading);

export const selectIsSteamConnecting = createSelector(selectSteamConnectStatus, (connectStatus) => connectStatus === AsyncStatus.Loading);
