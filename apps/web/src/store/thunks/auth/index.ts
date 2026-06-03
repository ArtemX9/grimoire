import { apiFetch } from '@/lib/apiFetch';
import {
  authGetSessionFulfilled,
  authGetSessionPending,
  authGetSessionRejected,
  authSignInFulfilled,
  authSignInPending,
  authSignInRejected,
  authSignOutFulfilled,
} from '@/store/actions/auth';
import type { AppThunk } from '@/store/store';

import type { Session, SignInArgs } from './types';

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

export const getSession = (): AppThunk<Promise<Session | null>> => async (dispatch) => {
  dispatch(authGetSessionPending());
  try {
    const data = await apiFetch<Session | null>('/auth/get-session');
    dispatch(authGetSessionFulfilled(data));
    return data;
  } catch (err) {
    dispatch(authGetSessionRejected(err instanceof Error ? err.message : 'Unknown error'));
    return null;
  }
};

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------

export const signIn =
  (args: SignInArgs): AppThunk<Promise<Session>> =>
  async (dispatch) => {
    dispatch(authSignInPending());
    try {
      const data = await apiFetch<Session>('/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      dispatch(authSignInFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(authSignInRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

export const signOut = (): AppThunk<Promise<void>> => async (dispatch) => {
  try {
    await apiFetch<void>('/auth/sign-out', { method: 'POST' });
    dispatch(authSignOutFulfilled());
  } catch {
    dispatch(authSignOutFulfilled());
  }
};
