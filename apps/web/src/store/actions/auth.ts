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

export const authGetSessionPending = () => ({ type: AUTH_GET_SESSION_PENDING }) as const;
export const authGetSessionFulfilled = (payload: Session | null) => ({ type: AUTH_GET_SESSION_FULFILLED, payload }) as const;
export const authGetSessionRejected = (error: string) => ({ type: AUTH_GET_SESSION_REJECTED, error }) as const;

export const authSignInPending = () => ({ type: AUTH_SIGN_IN_PENDING }) as const;
export const authSignInFulfilled = (payload: Session) => ({ type: AUTH_SIGN_IN_FULFILLED, payload }) as const;
export const authSignInRejected = (error: string) => ({ type: AUTH_SIGN_IN_REJECTED, error }) as const;

export const authSignOutFulfilled = () => ({ type: AUTH_SIGN_OUT_FULFILLED }) as const;

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
