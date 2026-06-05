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
  steamConnectFulfilled,
  steamConnectPending,
  steamConnectRejected,
  steamGetStatusFulfilled,
  steamGetStatusPending,
  steamGetStatusRejected,
  steamSyncFulfilled,
  steamSyncPending,
  steamSyncRejected,
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

export function steamReducer(state = initialState, action: SteamAction): SteamState {
  switch (action.type) {
    // getSteamStatus
    case STEAM_GET_STATUS_PENDING:
      return handleSteamGetStatusStart(state, action as ReturnType<typeof steamGetStatusPending>);
    case STEAM_GET_STATUS_FULFILLED:
      return handleSteamGetStatusSuccess(state, action as ReturnType<typeof steamGetStatusFulfilled>);
    case STEAM_GET_STATUS_REJECTED:
      return handleSteamGetStatusFailure(state, action as ReturnType<typeof steamGetStatusRejected>);

    // connectSteam
    case STEAM_CONNECT_PENDING:
      return handleSteamConnectStart(state, action as ReturnType<typeof steamConnectPending>);
    case STEAM_CONNECT_FULFILLED:
      return handleSteamConnectSuccess(state, action as ReturnType<typeof steamConnectFulfilled>);
    case STEAM_CONNECT_REJECTED:
      return handleSteamConnectFailure(state, action as ReturnType<typeof steamConnectRejected>);

    // syncSteam
    case STEAM_SYNC_PENDING:
      return handleSteamSyncStart(state, action as ReturnType<typeof steamSyncPending>);
    case STEAM_SYNC_FULFILLED:
      return handleSteamSyncSuccess(state, action as ReturnType<typeof steamSyncFulfilled>);
    case STEAM_SYNC_REJECTED:
      return handleSteamSyncFailure(state, action as ReturnType<typeof steamSyncRejected>);

    default:
      return state;
  }
}

// getSteamStatus
function handleSteamGetStatusStart(state: SteamState, _action: ReturnType<typeof steamGetStatusPending>): SteamState {
  return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
}
function handleSteamGetStatusSuccess(state: SteamState, action: ReturnType<typeof steamGetStatusFulfilled>): SteamState {
  return { ...state, fetchStatus: AsyncStatus.Succeeded, status: action.payload.syncStatus };
}
function handleSteamGetStatusFailure(state: SteamState, action: ReturnType<typeof steamGetStatusRejected>): SteamState {
  return { ...state, fetchStatus: AsyncStatus.Failed, error: action.payload.error };
}

// connectSteam
function handleSteamConnectStart(state: SteamState, _action: ReturnType<typeof steamConnectPending>): SteamState {
  return { ...state, connectStatus: AsyncStatus.Loading, error: null };
}
function handleSteamConnectSuccess(state: SteamState, _action: ReturnType<typeof steamConnectFulfilled>): SteamState {
  return { ...state, connectStatus: AsyncStatus.Succeeded };
}
function handleSteamConnectFailure(state: SteamState, action: ReturnType<typeof steamConnectRejected>): SteamState {
  return { ...state, connectStatus: AsyncStatus.Failed, error: action.payload.error };
}

// syncSteam
function handleSteamSyncStart(state: SteamState, _action: ReturnType<typeof steamSyncPending>): SteamState {
  return { ...state, syncStatus: AsyncStatus.Loading, error: null };
}
function handleSteamSyncSuccess(state: SteamState, _action: ReturnType<typeof steamSyncFulfilled>): SteamState {
  return { ...state, syncStatus: AsyncStatus.Succeeded };
}
function handleSteamSyncFailure(state: SteamState, action: ReturnType<typeof steamSyncRejected>): SteamState {
  return { ...state, syncStatus: AsyncStatus.Failed, error: action.payload.error };
}

export default steamReducer;
