import type { Session } from '@/store/thunks/auth/types';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const AUTH_GET_SESSION_PENDING = 'auth/getSession/pending';
export const AUTH_GET_SESSION_FULFILLED = 'auth/getSession/fulfilled';
export const AUTH_GET_SESSION_REJECTED = 'auth/getSession/rejected';

export const AUTH_SIGN_IN_PENDING = 'auth/signIn/pending';
export const AUTH_SIGN_IN_FULFILLED = 'auth/signIn/fulfilled';
export const AUTH_SIGN_IN_REJECTED = 'auth/signIn/rejected';

export const AUTH_SIGN_OUT_FULFILLED = 'auth/signOut/fulfilled';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const authGetSessionPending = () => ({ type: AUTH_GET_SESSION_PENDING, payload: {} });
export const authGetSessionFulfilled = (session: Session | null) => ({ type: AUTH_GET_SESSION_FULFILLED, payload: { session } });
export const authGetSessionRejected = (error: string) => ({ type: AUTH_GET_SESSION_REJECTED, payload: { error } });

export const authSignInPending = () => ({ type: AUTH_SIGN_IN_PENDING, payload: {} });
export const authSignInFulfilled = (session: Session) => ({ type: AUTH_SIGN_IN_FULFILLED, payload: { session } });
export const authSignInRejected = (error: string) => ({ type: AUTH_SIGN_IN_REJECTED, payload: { error } });

export const authSignOutFulfilled = () => ({ type: AUTH_SIGN_OUT_FULFILLED, payload: {} });

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type AuthAction =
  | ReturnType<typeof authGetSessionPending>
  | ReturnType<typeof authGetSessionFulfilled>
  | ReturnType<typeof authGetSessionRejected>
  | ReturnType<typeof authSignInPending>
  | ReturnType<typeof authSignInFulfilled>
  | ReturnType<typeof authSignInRejected>
  | ReturnType<typeof authSignOutFulfilled>;
