import { AsyncStatus, PlatformSyncStatus } from '@grimoire/shared';

import {
  XBOX_GET_STATUS_FULFILLED,
  XBOX_GET_STATUS_PENDING,
  XBOX_GET_STATUS_REJECTED,
  XBOX_SYNC_FULFILLED,
  XBOX_SYNC_PENDING,
  XBOX_SYNC_REJECTED,
  type XboxAction,
  xboxGetStatusFulfilled,
  xboxGetStatusPending,
  xboxGetStatusRejected,
  xboxSyncFulfilled,
  xboxSyncPending,
  xboxSyncRejected,
} from '@/store/actions/xbox';

export const XBOX_SLICE = 'xbox';

export interface XboxState {
  status: PlatformSyncStatus | null;
  fetchStatus: AsyncStatus;
  syncStatus: AsyncStatus;
  error: string | null;
}

const initialState: XboxState = {
  status: null,
  fetchStatus: AsyncStatus.Idle,
  syncStatus: AsyncStatus.Idle,
  error: null,
};

export function xboxReducer(state = initialState, action: XboxAction): XboxState {
  switch (action.type) {
    // getXboxStatus
    case XBOX_GET_STATUS_PENDING:
      return handleXboxGetStatusStart(state, action as ReturnType<typeof xboxGetStatusPending>);
    case XBOX_GET_STATUS_FULFILLED:
      return handleXboxGetStatusSuccess(state, action as ReturnType<typeof xboxGetStatusFulfilled>);
    case XBOX_GET_STATUS_REJECTED:
      return handleXboxGetStatusFailure(state, action as ReturnType<typeof xboxGetStatusRejected>);

    // syncXbox
    case XBOX_SYNC_PENDING:
      return handleXboxSyncStart(state, action as ReturnType<typeof xboxSyncPending>);
    case XBOX_SYNC_FULFILLED:
      return handleXboxSyncSuccess(state, action as ReturnType<typeof xboxSyncFulfilled>);
    case XBOX_SYNC_REJECTED:
      return handleXboxSyncFailure(state, action as ReturnType<typeof xboxSyncRejected>);

    default:
      return state;
  }
}
// getXboxStatus
function handleXboxGetStatusStart(state: XboxState, action: ReturnType<typeof xboxGetStatusPending>): XboxState {
  return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
}
function handleXboxGetStatusSuccess(state: XboxState, action: ReturnType<typeof xboxGetStatusFulfilled>): XboxState {
  return { ...state, fetchStatus: AsyncStatus.Succeeded, status: action.payload.syncStatus };
}
function handleXboxGetStatusFailure(state: XboxState, action: ReturnType<typeof xboxGetStatusRejected>): XboxState {
  return { ...state, fetchStatus: AsyncStatus.Failed, error: action.payload.error };
}

// syncXbox
function handleXboxSyncStart(state: XboxState, action: ReturnType<typeof xboxSyncPending>): XboxState {
  return { ...state, syncStatus: AsyncStatus.Loading, status: { ...state?.status, connected: true, isSyncing: true }, error: null };
}
function handleXboxSyncSuccess(state: XboxState, action: ReturnType<typeof xboxSyncFulfilled>): XboxState {
  return { ...state, syncStatus: AsyncStatus.Succeeded, status: { ...state?.status, connected: true, isSyncing: true }, error: null };
}
function handleXboxSyncFailure(state: XboxState, action: ReturnType<typeof xboxSyncRejected>): XboxState {
  return {
    ...state,
    syncStatus: AsyncStatus.Failed,
    status: { ...state?.status, connected: true, isSyncing: false },
    error: action.payload.error,
  };
}

export default xboxReducer;
