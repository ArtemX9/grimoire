import { AsyncStatus, PlatformSyncStatus } from '@grimoire/shared';

import {
  XBOX_GET_STATUS_FULFILLED,
  XBOX_GET_STATUS_PENDING,
  XBOX_GET_STATUS_REJECTED,
  XBOX_SYNC_FULFILLED,
  XBOX_SYNC_PENDING,
  XBOX_SYNC_REJECTED,
  type XboxAction,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function xboxReducer(state = initialState, rawAction: any): XboxState {
  const action = rawAction as XboxAction;
  switch (action.type) {
    // getXboxStatus
    case XBOX_GET_STATUS_PENDING:
      return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
    case XBOX_GET_STATUS_FULFILLED:
      return { ...state, fetchStatus: AsyncStatus.Succeeded, status: action.payload };
    case XBOX_GET_STATUS_REJECTED:
      return { ...state, fetchStatus: AsyncStatus.Failed, error: action.error };

    // syncXbox
    case XBOX_SYNC_PENDING:
      return { ...state, syncStatus: AsyncStatus.Loading, error: null };
    case XBOX_SYNC_FULFILLED:
      return { ...state, syncStatus: AsyncStatus.Succeeded };
    case XBOX_SYNC_REJECTED:
      return { ...state, syncStatus: AsyncStatus.Failed, error: action.error };

    default:
      return state;
  }
}

export default xboxReducer;
