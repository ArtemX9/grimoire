import { AsyncStatus, Role } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import {
  AUTH_GET_SESSION_FULFILLED,
  AUTH_GET_SESSION_PENDING,
  AUTH_GET_SESSION_REJECTED,
  AUTH_SIGN_IN_FULFILLED,
  AUTH_SIGN_IN_PENDING,
  AUTH_SIGN_IN_REJECTED,
  AUTH_SIGN_OUT_FULFILLED,
  authGetSessionFulfilled,
  authGetSessionPending,
  authGetSessionRejected,
  authSignInFulfilled,
  authSignInPending,
  authSignInRejected,
  authSignOutFulfilled,
} from '@/store/actions/auth';
import reducer, { AUTH_SLICE, AuthState } from '@/store/state/auth/index';
import {
  selectAiEnabled,
  selectAuthStatus,
  selectIsAdmin,
  selectIsAuthenticated,
  selectIsBootstrapped,
  selectMustChangePassword,
  selectSession,
} from '@/store/state/auth/selectors';
import { generateSession } from '@/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' } as never);

function makeRootState(overrides: Partial<AuthState> = {}) {
  return { [AUTH_SLICE]: { ...initialState, ...overrides } };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('authSlice — initial state', () => {
  it('has null session', () => {
    expect(initialState.session).toBeNull();
  });

  it('is not bootstrapped', () => {
    expect(initialState.isBootstrapped).toBe(false);
  });

  it('has Idle status', () => {
    expect(initialState.status).toBe(AsyncStatus.Idle);
  });
});

// ---------------------------------------------------------------------------
// getSession lifecycle
// ---------------------------------------------------------------------------

describe('authSlice — getSession', () => {
  it('action type constants are correct', () => {
    expect(AUTH_GET_SESSION_PENDING).toBe('auth/getSession/pending');
    expect(AUTH_GET_SESSION_FULFILLED).toBe('auth/getSession/fulfilled');
    expect(AUTH_GET_SESSION_REJECTED).toBe('auth/getSession/rejected');
  });

  it('sets Loading on pending', () => {
    const next = reducer(initialState, authGetSessionPending());
    expect(next.status).toBe(AsyncStatus.Loading);
  });

  it('sets session and bootstrapped on fulfilled', () => {
    const session = generateSession();
    const next = reducer(initialState, authGetSessionFulfilled(session));
    expect(next.session).toEqual(session);
    expect(next.isBootstrapped).toBe(true);
    expect(next.status).toBe(AsyncStatus.Succeeded);
  });

  it('marks bootstrapped even on rejection', () => {
    const next = reducer(initialState, authGetSessionRejected('Network error'));
    expect(next.isBootstrapped).toBe(true);
    expect(next.session).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// signIn lifecycle
// ---------------------------------------------------------------------------

describe('authSlice — signIn', () => {
  it('action type constants are correct', () => {
    expect(AUTH_SIGN_IN_PENDING).toBe('auth/signIn/pending');
    expect(AUTH_SIGN_IN_FULFILLED).toBe('auth/signIn/fulfilled');
    expect(AUTH_SIGN_IN_REJECTED).toBe('auth/signIn/rejected');
  });

  it('sets session on fulfilled', () => {
    const session = generateSession({ role: Role.ADMIN });
    const next = reducer(initialState, authSignInFulfilled(session));
    expect(next.session).toEqual(session);
  });

  it('sets error on rejected', () => {
    const next = reducer(initialState, authSignInRejected('Invalid credentials'));
    expect(next.status).toBe(AsyncStatus.Failed);
    expect(next.error).toBe('Invalid credentials');
  });

  it('sets Loading on pending', () => {
    const next = reducer(initialState, authSignInPending());
    expect(next.status).toBe(AsyncStatus.Loading);
  });
});

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

describe('authSlice — signOut', () => {
  it('action type constant is correct', () => {
    expect(AUTH_SIGN_OUT_FULFILLED).toBe('auth/signOut/fulfilled');
  });

  it('clears session on fulfilled', () => {
    const withSession = reducer(initialState, authGetSessionFulfilled(generateSession()));
    const next = reducer(withSession, authSignOutFulfilled());
    expect(next.session).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('auth selectors', () => {
  it('selectIsAuthenticated returns false when no session', () => {
    const state = makeRootState({ session: null });
    expect(selectIsAuthenticated(state as never)).toBe(false);
  });

  it('selectIsAuthenticated returns true with session', () => {
    const state = makeRootState({ session: generateSession() });
    expect(selectIsAuthenticated(state as never)).toBe(true);
  });

  it('selectIsAdmin returns true for admin role', () => {
    const state = makeRootState({ session: generateSession({ role: Role.ADMIN }) });
    expect(selectIsAdmin(state as never)).toBe(true);
  });

  it('selectAiEnabled returns aiEnabled from session', () => {
    const state = makeRootState({ session: generateSession({ aiEnabled: true }) });
    expect(selectAiEnabled(state as never)).toBe(true);
  });

  it('selectMustChangePassword returns flag from session', () => {
    const state = makeRootState({ session: generateSession({ mustChangePassword: true }) });
    expect(selectMustChangePassword(state as never)).toBe(true);
  });

  it('selectIsBootstrapped returns isBootstrapped', () => {
    const state = makeRootState({ isBootstrapped: true });
    expect(selectIsBootstrapped(state as never)).toBe(true);
  });

  it('selectSession returns session', () => {
    const session = generateSession();
    const state = makeRootState({ session });
    expect(selectSession(state as never)).toEqual(session);
  });

  it('selectAuthStatus returns status', () => {
    const state = makeRootState({ status: AsyncStatus.Loading });
    expect(selectAuthStatus(state as never)).toBe(AsyncStatus.Loading);
  });
});
