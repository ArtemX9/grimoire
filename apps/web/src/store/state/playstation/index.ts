import { AsyncStatus, PlatformSyncStatus } from '@grimoire/shared';

import {
  PSN_CONNECT_FULFILLED,
  PSN_CONNECT_PENDING,
  PSN_CONNECT_REJECTED,
  PSN_GET_STATUS_FULFILLED,
  PSN_GET_STATUS_PENDING,
  PSN_GET_STATUS_REJECTED,
  PSN_SYNC_FULFILLED,
  PSN_SYNC_PENDING,
  PSN_SYNC_REJECTED,
  type PlaystationAction,
  psnConnectFulfilled,
  psnConnectPending,
  psnConnectRejected,
  psnGetStatusFulfilled,
  psnGetStatusPending,
  psnGetStatusRejected,
  psnSyncFulfilled,
  psnSyncPending,
  psnSyncRejected,
} from '@/store/actions/playstation';

export const PLAYSTATION_SLICE = 'playstation';

export interface PlaystationState {
  status: PlatformSyncStatus | null;
  fetchStatus: AsyncStatus;
  connectStatus: AsyncStatus;
  syncStatus: AsyncStatus;
  error: string | null;
}

const initialState: PlaystationState = {
  status: null,
  fetchStatus: AsyncStatus.Idle,
  connectStatus: AsyncStatus.Idle,
  syncStatus: AsyncStatus.Idle,
  error: null,
};

export function playstationReducer(state = initialState, action: PlaystationAction): PlaystationState {
  switch (action.type) {
    // getPSNStatus
    case PSN_GET_STATUS_PENDING:
      return handlePsnGetStatusStart(state, action as ReturnType<typeof psnGetStatusPending>);
    case PSN_GET_STATUS_FULFILLED:
      return handlePsnGetStatusSuccess(state, action as ReturnType<typeof psnGetStatusFulfilled>);
    case PSN_GET_STATUS_REJECTED:
      return handlePsnGetStatusFailure(state, action as ReturnType<typeof psnGetStatusRejected>);

    // connectPSN
    case PSN_CONNECT_PENDING:
      return handlePsnConnectStart(state, action as ReturnType<typeof psnConnectPending>);
    case PSN_CONNECT_FULFILLED:
      return handlePsnConnectSuccess(state, action as ReturnType<typeof psnConnectFulfilled>);
    case PSN_CONNECT_REJECTED:
      return handlePsnConnectFailure(state, action as ReturnType<typeof psnConnectRejected>);

    // syncPSN
    case PSN_SYNC_PENDING:
      return handlePsnSyncStart(state, action as ReturnType<typeof psnSyncPending>);
    case PSN_SYNC_FULFILLED:
      return handlePsnSyncSuccess(state, action as ReturnType<typeof psnSyncFulfilled>);
    case PSN_SYNC_REJECTED:
      return handlePsnSyncFailure(state, action as ReturnType<typeof psnSyncRejected>);

    default:
      return state;
  }
}

// getPSNStatus
function handlePsnGetStatusStart(state: PlaystationState, _action: ReturnType<typeof psnGetStatusPending>): PlaystationState {
  return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
}
function handlePsnGetStatusSuccess(state: PlaystationState, action: ReturnType<typeof psnGetStatusFulfilled>): PlaystationState {
  return { ...state, fetchStatus: AsyncStatus.Succeeded, status: action.payload.syncStatus };
}
function handlePsnGetStatusFailure(state: PlaystationState, action: ReturnType<typeof psnGetStatusRejected>): PlaystationState {
  return { ...state, fetchStatus: AsyncStatus.Failed, error: action.payload.error };
}

// connectPSN
function handlePsnConnectStart(state: PlaystationState, _action: ReturnType<typeof psnConnectPending>): PlaystationState {
  return { ...state, connectStatus: AsyncStatus.Loading, error: null };
}
function handlePsnConnectSuccess(state: PlaystationState, _action: ReturnType<typeof psnConnectFulfilled>): PlaystationState {
  return { ...state, connectStatus: AsyncStatus.Succeeded };
}
function handlePsnConnectFailure(state: PlaystationState, action: ReturnType<typeof psnConnectRejected>): PlaystationState {
  return { ...state, connectStatus: AsyncStatus.Failed, error: action.payload.error };
}

// syncPSN
function handlePsnSyncStart(state: PlaystationState, _action: ReturnType<typeof psnSyncPending>): PlaystationState {
  return { ...state, syncStatus: AsyncStatus.Loading, status: { ...state?.status, connected: true, isSyncing: true }, error: null };
}
function handlePsnSyncSuccess(state: PlaystationState, _action: ReturnType<typeof psnSyncFulfilled>): PlaystationState {
  return { ...state, syncStatus: AsyncStatus.Succeeded, status: { ...state?.status, connected: true, isSyncing: true } };
}
function handlePsnSyncFailure(state: PlaystationState, action: ReturnType<typeof psnSyncRejected>): PlaystationState {
  return { ...state, syncStatus: AsyncStatus.Failed, status: { ...state?.status, connected: true, isSyncing: false }, error: action.payload.error };
}

export default playstationReducer;
