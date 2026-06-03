import { AsyncStatus } from '@grimoire/shared';

import {
  AUTH_GET_SESSION_FULFILLED,
  AUTH_GET_SESSION_PENDING,
  AUTH_GET_SESSION_REJECTED,
  AUTH_SIGN_IN_FULFILLED,
  AUTH_SIGN_IN_PENDING,
  AUTH_SIGN_IN_REJECTED,
  AUTH_SIGN_OUT_FULFILLED,
  type AuthAction,
} from '@/store/actions/auth';
import type { Session } from '@/store/thunks/auth/types';

export { type Session } from '@/store/thunks/auth/types';

export const AUTH_SLICE = 'auth';

export interface AuthState {
  session: Session | null;
  status: AsyncStatus;
  isBootstrapped: boolean;
  error: string | null;
}

const initialState: AuthState = {
  session: null,
  status: AsyncStatus.Idle,
  isBootstrapped: false,
  error: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function authReducer(state = initialState, rawAction: any): AuthState {
  const action = rawAction as AuthAction;
  switch (action.type) {
    case AUTH_GET_SESSION_PENDING:
      return { ...state, status: AsyncStatus.Loading, error: null };

    case AUTH_GET_SESSION_FULFILLED:
      return { ...state, status: AsyncStatus.Succeeded, session: action.payload, isBootstrapped: true };

    case AUTH_GET_SESSION_REJECTED:
      return { ...state, status: AsyncStatus.Failed, session: null, isBootstrapped: true };

    case AUTH_SIGN_IN_PENDING:
      return { ...state, status: AsyncStatus.Loading, error: null };

    case AUTH_SIGN_IN_FULFILLED:
      return { ...state, status: AsyncStatus.Succeeded, session: action.payload, isBootstrapped: true };

    case AUTH_SIGN_IN_REJECTED:
      return { ...state, status: AsyncStatus.Failed, error: action.error };

    case AUTH_SIGN_OUT_FULFILLED:
      return { ...state, session: null, status: AsyncStatus.Idle };

    default:
      return state;
  }
}

export default authReducer;
