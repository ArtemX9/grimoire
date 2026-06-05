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
  authGetSessionFulfilled,
  authGetSessionPending,
  authGetSessionRejected,
  authSignInFulfilled,
  authSignInPending,
  authSignInRejected,
  authSignOutFulfilled,
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

export function authReducer(state = initialState, action: AuthAction): AuthState {
  switch (action.type) {
    // getSession
    case AUTH_GET_SESSION_PENDING:
      return handleAuthGetSessionStart(state, action as ReturnType<typeof authGetSessionPending>);
    case AUTH_GET_SESSION_FULFILLED:
      return handleAuthGetSessionSuccess(state, action as ReturnType<typeof authGetSessionFulfilled>);
    case AUTH_GET_SESSION_REJECTED:
      return handleAuthGetSessionFailure(state, action as ReturnType<typeof authGetSessionRejected>);

    // signIn
    case AUTH_SIGN_IN_PENDING:
      return handleAuthSignInStart(state, action as ReturnType<typeof authSignInPending>);
    case AUTH_SIGN_IN_FULFILLED:
      return handleAuthSignInSuccess(state, action as ReturnType<typeof authSignInFulfilled>);
    case AUTH_SIGN_IN_REJECTED:
      return handleAuthSignInFailure(state, action as ReturnType<typeof authSignInRejected>);

    // signOut
    case AUTH_SIGN_OUT_FULFILLED:
      return handleAuthSignOutSuccess(state, action as ReturnType<typeof authSignOutFulfilled>);

    default:
      return state;
  }
}

// getSession
function handleAuthGetSessionStart(state: AuthState, _action: ReturnType<typeof authGetSessionPending>): AuthState {
  return { ...state, status: AsyncStatus.Loading, error: null };
}
function handleAuthGetSessionSuccess(state: AuthState, action: ReturnType<typeof authGetSessionFulfilled>): AuthState {
  return { ...state, status: AsyncStatus.Succeeded, session: action.payload.session, isBootstrapped: true };
}
function handleAuthGetSessionFailure(state: AuthState, _action: ReturnType<typeof authGetSessionRejected>): AuthState {
  return { ...state, status: AsyncStatus.Failed, session: null, isBootstrapped: true };
}

// signIn
function handleAuthSignInStart(state: AuthState, _action: ReturnType<typeof authSignInPending>): AuthState {
  return { ...state, status: AsyncStatus.Loading, error: null };
}
function handleAuthSignInSuccess(state: AuthState, action: ReturnType<typeof authSignInFulfilled>): AuthState {
  return { ...state, status: AsyncStatus.Succeeded, session: action.payload.session, isBootstrapped: true };
}
function handleAuthSignInFailure(state: AuthState, action: ReturnType<typeof authSignInRejected>): AuthState {
  return { ...state, status: AsyncStatus.Failed, error: action.payload.error };
}

// signOut
function handleAuthSignOutSuccess(state: AuthState, _action: ReturnType<typeof authSignOutFulfilled>): AuthState {
  return { ...state, session: null, status: AsyncStatus.Idle };
}

export default authReducer;
