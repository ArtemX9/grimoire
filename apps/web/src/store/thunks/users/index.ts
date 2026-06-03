import { User } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import {
  usersChangePasswordFulfilled,
  usersChangePasswordPending,
  usersChangePasswordRejected,
  usersGetMeFulfilled,
  usersGetMePending,
  usersGetMeRejected,
  usersUpdateMeFulfilled,
  usersUpdateMePending,
  usersUpdateMeRejected,
} from '@/store/actions/users';
import type { AppThunk } from '@/store/store';

import type { ChangePasswordArgs, UpdateMeArgs } from './types';

// ---------------------------------------------------------------------------
// getMe
// ---------------------------------------------------------------------------

export const getMe = (): AppThunk<Promise<User>> => async (dispatch) => {
  dispatch(usersGetMePending());
  try {
    const data = await apiFetch<User>('/users/me');
    dispatch(usersGetMeFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(usersGetMeRejected(message));
    throw new Error(message);
  }
};

// ---------------------------------------------------------------------------
// updateMe
// ---------------------------------------------------------------------------

export const updateMe =
  (args: UpdateMeArgs): AppThunk<Promise<User>> =>
  async (dispatch) => {
    dispatch(usersUpdateMePending());
    try {
      const data = await apiFetch<User>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(args),
      });
      dispatch(usersUpdateMeFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(usersUpdateMeRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// changePassword
// ---------------------------------------------------------------------------

export const changePassword =
  (args: ChangePasswordArgs): AppThunk<Promise<void>> =>
  async (dispatch) => {
    dispatch(usersChangePasswordPending());
    try {
      await apiFetch<void>('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify(args),
      });
      dispatch(usersChangePasswordFulfilled());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(usersChangePasswordRejected(message));
      throw new Error(message);
    }
  };
