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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function playstationReducer(state = initialState, rawAction: any): PlaystationState {
  const action = rawAction as PlaystationAction;
  switch (action.type) {
    // getPSNStatus
    case PSN_GET_STATUS_PENDING:
      return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
    case PSN_GET_STATUS_FULFILLED:
      return { ...state, fetchStatus: AsyncStatus.Succeeded, status: action.payload };
    case PSN_GET_STATUS_REJECTED:
      return { ...state, fetchStatus: AsyncStatus.Failed, error: action.error };

    // connectPSN
    case PSN_CONNECT_PENDING:
      return { ...state, connectStatus: AsyncStatus.Loading, error: null };
    case PSN_CONNECT_FULFILLED:
      return { ...state, connectStatus: AsyncStatus.Succeeded };
    case PSN_CONNECT_REJECTED:
      return { ...state, connectStatus: AsyncStatus.Failed, error: action.error };

    // syncPSN
    case PSN_SYNC_PENDING:
      return { ...state, syncStatus: AsyncStatus.Loading, error: null };
    case PSN_SYNC_FULFILLED:
      return { ...state, syncStatus: AsyncStatus.Succeeded };
    case PSN_SYNC_REJECTED:
      return { ...state, syncStatus: AsyncStatus.Failed, error: action.error };

    default:
      return state;
  }
}

export default playstationReducer;
