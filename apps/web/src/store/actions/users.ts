import { User } from '@grimoire/shared';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const USERS_GET_ME_PENDING = 'users/getMe/pending';
export const USERS_GET_ME_FULFILLED = 'users/getMe/fulfilled';
export const USERS_GET_ME_REJECTED = 'users/getMe/rejected';

export const USERS_UPDATE_ME_PENDING = 'users/updateMe/pending';
export const USERS_UPDATE_ME_FULFILLED = 'users/updateMe/fulfilled';
export const USERS_UPDATE_ME_REJECTED = 'users/updateMe/rejected';

export const USERS_CHANGE_PASSWORD_PENDING = 'users/changePassword/pending';
export const USERS_CHANGE_PASSWORD_FULFILLED = 'users/changePassword/fulfilled';
export const USERS_CHANGE_PASSWORD_REJECTED = 'users/changePassword/rejected';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const usersGetMePending = () => ({ type: USERS_GET_ME_PENDING, payload: {} });
export const usersGetMeFulfilled = (user: User) => ({ type: USERS_GET_ME_FULFILLED, payload: { user } });
export const usersGetMeRejected = (error: string) => ({ type: USERS_GET_ME_REJECTED, payload: { error } });

export const usersUpdateMePending = () => ({ type: USERS_UPDATE_ME_PENDING, payload: {} });
export const usersUpdateMeFulfilled = (user: User) => ({ type: USERS_UPDATE_ME_FULFILLED, payload: { user } });
export const usersUpdateMeRejected = (error: string) => ({ type: USERS_UPDATE_ME_REJECTED, payload: { error } });

export const usersChangePasswordPending = () => ({ type: USERS_CHANGE_PASSWORD_PENDING, payload: {} });
export const usersChangePasswordFulfilled = () => ({ type: USERS_CHANGE_PASSWORD_FULFILLED, payload: {} });
export const usersChangePasswordRejected = (error: string) => ({ type: USERS_CHANGE_PASSWORD_REJECTED, payload: { error } });

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type UsersAction =
  | ReturnType<typeof usersGetMePending>
  | ReturnType<typeof usersGetMeFulfilled>
  | ReturnType<typeof usersGetMeRejected>
  | ReturnType<typeof usersUpdateMePending>
  | ReturnType<typeof usersUpdateMeFulfilled>
  | ReturnType<typeof usersUpdateMeRejected>
  | ReturnType<typeof usersChangePasswordPending>
  | ReturnType<typeof usersChangePasswordFulfilled>
  | ReturnType<typeof usersChangePasswordRejected>;
