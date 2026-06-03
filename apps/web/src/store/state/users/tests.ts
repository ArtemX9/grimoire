import { AsyncStatus } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import {
  USERS_GET_ME_FULFILLED,
  USERS_GET_ME_PENDING,
  USERS_GET_ME_REJECTED,
  USERS_UPDATE_ME_FULFILLED,
  USERS_UPDATE_ME_PENDING,
  usersGetMeFulfilled,
  usersGetMePending,
  usersGetMeRejected,
  usersUpdateMeFulfilled,
  usersUpdateMePending,
} from '@/store/actions/users';
import reducer, { USERS_SLICE, UsersState } from '@/store/state/users/index';
import { selectCurrentUser, selectIsUserLoading, selectIsUserUpdating, selectUserStatus } from '@/store/state/users/selectors';
import { generateUser } from '@/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' } as never);

function makeRootState(overrides: Partial<UsersState> = {}) {
  return { [USERS_SLICE]: { ...initialState, ...overrides } };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('usersSlice — initial state', () => {
  it('has null user', () => {
    expect(initialState.user).toBeNull();
  });

  it('has Idle status', () => {
    expect(initialState.status).toBe(AsyncStatus.Idle);
  });
});

// ---------------------------------------------------------------------------
// Thunk type constants
// ---------------------------------------------------------------------------

describe('users action type constants', () => {
  it('getMe has correct type strings', () => {
    expect(USERS_GET_ME_PENDING).toBe('users/getMe/pending');
    expect(USERS_GET_ME_FULFILLED).toBe('users/getMe/fulfilled');
    expect(USERS_GET_ME_REJECTED).toBe('users/getMe/rejected');
  });

  it('updateMe has correct type strings', () => {
    expect(USERS_UPDATE_ME_PENDING).toBe('users/updateMe/pending');
    expect(USERS_UPDATE_ME_FULFILLED).toBe('users/updateMe/fulfilled');
  });
});

// ---------------------------------------------------------------------------
// getMe lifecycle
// ---------------------------------------------------------------------------

describe('usersSlice — getMe', () => {
  it('sets Loading on pending', () => {
    const next = reducer(initialState, usersGetMePending());
    expect(next.status).toBe(AsyncStatus.Loading);
  });

  it('sets user and Succeeded on fulfilled', () => {
    const user = generateUser();
    const next = reducer(initialState, usersGetMeFulfilled(user));
    expect(next.user).toEqual(user);
    expect(next.status).toBe(AsyncStatus.Succeeded);
  });

  it('sets Failed status on rejected', () => {
    const next = reducer(initialState, usersGetMeRejected('Unauthorized'));
    expect(next.status).toBe(AsyncStatus.Failed);
    expect(next.error).toBe('Unauthorized');
  });
});

// ---------------------------------------------------------------------------
// updateMe lifecycle
// ---------------------------------------------------------------------------

describe('usersSlice — updateMe', () => {
  it('updates user on fulfilled', () => {
    const original = generateUser({ name: 'Alice' });
    const updated = { ...original, name: 'Alice Updated' };
    const withUser = reducer(initialState, usersGetMeFulfilled(original));
    const next = reducer(withUser, usersUpdateMeFulfilled(updated));
    expect(next.user?.name).toBe('Alice Updated');
    expect(next.mutationStatus).toBe(AsyncStatus.Succeeded);
  });

  it('sets mutationStatus to Loading on pending', () => {
    const next = reducer(initialState, usersUpdateMePending());
    expect(next.mutationStatus).toBe(AsyncStatus.Loading);
  });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('users selectors', () => {
  it('selectCurrentUser returns user', () => {
    const user = generateUser();
    const state = makeRootState({ user });
    expect(selectCurrentUser(state as never)).toEqual(user);
  });

  it('selectUserStatus returns status', () => {
    const state = makeRootState({ status: AsyncStatus.Loading });
    expect(selectUserStatus(state as never)).toBe(AsyncStatus.Loading);
  });

  it('selectIsUserLoading returns true when Loading', () => {
    const state = makeRootState({ status: AsyncStatus.Loading });
    expect(selectIsUserLoading(state as never)).toBe(true);
  });

  it('selectIsUserUpdating returns true when mutationStatus is Loading', () => {
    const state = makeRootState({ mutationStatus: AsyncStatus.Loading });
    expect(selectIsUserUpdating(state as never)).toBe(true);
  });
});
