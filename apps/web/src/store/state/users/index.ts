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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usersReducer(state = initialState, rawAction: any): UsersState {
  const action = rawAction as UsersAction;
  switch (action.type) {
    // getMe
    case USERS_GET_ME_PENDING:
      return { ...state, status: AsyncStatus.Loading, error: null };
    case USERS_GET_ME_FULFILLED:
      return { ...state, status: AsyncStatus.Succeeded, user: action.payload };
    case USERS_GET_ME_REJECTED:
      return { ...state, status: AsyncStatus.Failed, error: action.error };

    // updateMe
    case USERS_UPDATE_ME_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
    case USERS_UPDATE_ME_FULFILLED:
      return { ...state, mutationStatus: AsyncStatus.Succeeded, user: action.payload };
    case USERS_UPDATE_ME_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    // changePassword
    case USERS_CHANGE_PASSWORD_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
    case USERS_CHANGE_PASSWORD_FULFILLED:
      return { ...state, mutationStatus: AsyncStatus.Succeeded };
    case USERS_CHANGE_PASSWORD_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    default:
      return state;
  }
}

export default usersReducer;
