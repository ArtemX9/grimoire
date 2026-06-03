import { AsyncStatus, PlatformSyncStatus } from '@grimoire/shared';

import {
  STEAM_CONNECT_FULFILLED,
  STEAM_CONNECT_PENDING,
  STEAM_CONNECT_REJECTED,
  STEAM_GET_STATUS_FULFILLED,
  STEAM_GET_STATUS_PENDING,
  STEAM_GET_STATUS_REJECTED,
  STEAM_SYNC_FULFILLED,
  STEAM_SYNC_PENDING,
  STEAM_SYNC_REJECTED,
  type SteamAction,
} from '@/store/actions/steam';

export const STEAM_SLICE = 'steam';

export interface SteamState {
  status: PlatformSyncStatus | null;
  fetchStatus: AsyncStatus;
  connectStatus: AsyncStatus;
  syncStatus: AsyncStatus;
  error: string | null;
}

const initialState: SteamState = {
  status: null,
  fetchStatus: AsyncStatus.Idle,
  connectStatus: AsyncStatus.Idle,
  syncStatus: AsyncStatus.Idle,
  error: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function steamReducer(state = initialState, rawAction: any): SteamState {
  const action = rawAction as SteamAction;
  switch (action.type) {
    // getSteamStatus
    case STEAM_GET_STATUS_PENDING:
      return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
    case STEAM_GET_STATUS_FULFILLED:
      return { ...state, fetchStatus: AsyncStatus.Succeeded, status: action.payload };
    case STEAM_GET_STATUS_REJECTED:
      return { ...state, fetchStatus: AsyncStatus.Failed, error: action.error };

    // connectSteam
    case STEAM_CONNECT_PENDING:
      return { ...state, connectStatus: AsyncStatus.Loading, error: null };
    case STEAM_CONNECT_FULFILLED:
      return { ...state, connectStatus: AsyncStatus.Succeeded };
    case STEAM_CONNECT_REJECTED:
      return { ...state, connectStatus: AsyncStatus.Failed, error: action.error };

    // syncSteam
    case STEAM_SYNC_PENDING:
      return { ...state, syncStatus: AsyncStatus.Loading, error: null };
    case STEAM_SYNC_FULFILLED:
      return { ...state, syncStatus: AsyncStatus.Succeeded };
    case STEAM_SYNC_REJECTED:
      return { ...state, syncStatus: AsyncStatus.Failed, error: action.error };

    default:
      return state;
  }
}

export default steamReducer;
