import { AsyncStatus, User } from '@grimoire/shared';

import {
  USERS_CHANGE_PASSWORD_FULFILLED,
  USERS_CHANGE_PASSWORD_PENDING,
  USERS_CHANGE_PASSWORD_REJECTED,
  USERS_GET_ME_FULFILLED,
  USERS_GET_ME_PENDING,
  USERS_GET_ME_REJECTED,
  USERS_UPDATE_ME_FULFILLED,
  USERS_UPDATE_ME_PENDING,
  USERS_UPDATE_ME_REJECTED,
  type UsersAction,
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

export const USERS_SLICE = 'users';

export interface UsersState {
  user: User | null;
  status: AsyncStatus;
  mutationStatus: AsyncStatus;
  error: string | null;
}

const initialState: UsersState = {
  user: null,
  status: AsyncStatus.Idle,
  mutationStatus: AsyncStatus.Idle,
  error: null,
};

export function usersReducer(state = initialState, action: UsersAction): UsersState {
  switch (action.type) {
    // getMe
    case USERS_GET_ME_PENDING:
      return handleUsersGetMeStart(state, action as ReturnType<typeof usersGetMePending>);
    case USERS_GET_ME_FULFILLED:
      return handleUsersGetMeSuccess(state, action as ReturnType<typeof usersGetMeFulfilled>);
    case USERS_GET_ME_REJECTED:
      return handleUsersGetMeFailure(state, action as ReturnType<typeof usersGetMeRejected>);

    // updateMe
    case USERS_UPDATE_ME_PENDING:
      return handleUsersUpdateMeStart(state, action as ReturnType<typeof usersUpdateMePending>);
    case USERS_UPDATE_ME_FULFILLED:
      return handleUsersUpdateMeSuccess(state, action as ReturnType<typeof usersUpdateMeFulfilled>);
    case USERS_UPDATE_ME_REJECTED:
      return handleUsersUpdateMeFailure(state, action as ReturnType<typeof usersUpdateMeRejected>);

    // changePassword
    case USERS_CHANGE_PASSWORD_PENDING:
      return handleUsersChangePasswordStart(state, action as ReturnType<typeof usersChangePasswordPending>);
    case USERS_CHANGE_PASSWORD_FULFILLED:
      return handleUsersChangePasswordSuccess(state, action as ReturnType<typeof usersChangePasswordFulfilled>);
    case USERS_CHANGE_PASSWORD_REJECTED:
      return handleUsersChangePasswordFailure(state, action as ReturnType<typeof usersChangePasswordRejected>);

    default:
      return state;
  }
}

// getMe
function handleUsersGetMeStart(state: UsersState, _action: ReturnType<typeof usersGetMePending>): UsersState {
  return { ...state, status: AsyncStatus.Loading, error: null };
}
function handleUsersGetMeSuccess(state: UsersState, action: ReturnType<typeof usersGetMeFulfilled>): UsersState {
  return { ...state, status: AsyncStatus.Succeeded, user: action.payload.user };
}
function handleUsersGetMeFailure(state: UsersState, action: ReturnType<typeof usersGetMeRejected>): UsersState {
  return { ...state, status: AsyncStatus.Failed, error: action.payload.error };
}

// updateMe
function handleUsersUpdateMeStart(state: UsersState, _action: ReturnType<typeof usersUpdateMePending>): UsersState {
  return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
}
function handleUsersUpdateMeSuccess(state: UsersState, action: ReturnType<typeof usersUpdateMeFulfilled>): UsersState {
  return { ...state, mutationStatus: AsyncStatus.Succeeded, user: action.payload.user };
}
function handleUsersUpdateMeFailure(state: UsersState, action: ReturnType<typeof usersUpdateMeRejected>): UsersState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

// changePassword
function handleUsersChangePasswordStart(state: UsersState, _action: ReturnType<typeof usersChangePasswordPending>): UsersState {
  return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
}
function handleUsersChangePasswordSuccess(state: UsersState, _action: ReturnType<typeof usersChangePasswordFulfilled>): UsersState {
  return { ...state, mutationStatus: AsyncStatus.Succeeded };
}
function handleUsersChangePasswordFailure(state: UsersState, action: ReturnType<typeof usersChangePasswordRejected>): UsersState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

export default usersReducer;
