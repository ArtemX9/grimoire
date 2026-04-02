import { Role } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import type { Session } from '@/api/authApi';
import reducer, { sessionCleared, sessionLoaded } from '@/store/authSlice';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' });

function makeSession(overrides: Partial<Session['user']> = {}): Session {
  return {
    user: {
      id: 'user-1',
      email: 'tester@grimoire.app',
      name: 'Tester',
      role: Role.USER,
      mustChangePassword: false,
      aiEnabled: true,
      aiRequestsLimit: 10,
      ...overrides,
    },
  };
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
});

// ---------------------------------------------------------------------------
// sessionLoaded
// ---------------------------------------------------------------------------

describe('authSlice — sessionLoaded', () => {
  it('stores a valid session and marks bootstrapped', () => {
    const session = makeSession();
    const next = reducer(initialState, sessionLoaded(session));

    expect(next.session).toEqual(session);
    expect(next.isBootstrapped).toBe(true);
  });

  it('stores null session and still marks bootstrapped (unauthenticated boot)', () => {
    const next = reducer(initialState, sessionLoaded(null));

    expect(next.session).toBeNull();
    expect(next.isBootstrapped).toBe(true);
  });

  it('overwrites an existing session with a new one', () => {
    const first = makeSession({ id: 'user-1', email: 'first@grimoire.app' });
    const second = makeSession({ id: 'user-2', email: 'second@grimoire.app' });

    const afterFirst = reducer(initialState, sessionLoaded(first));
    const afterSecond = reducer(afterFirst, sessionLoaded(second));

    expect(afterSecond.session?.user.id).toBe('user-2');
    expect(afterSecond.session?.user.email).toBe('second@grimoire.app');
  });

  it('overwrites an existing session with null (forced sign-out via session load)', () => {
    const withSession = reducer(initialState, sessionLoaded(makeSession()));
    const next = reducer(withSession, sessionLoaded(null));

    expect(next.session).toBeNull();
    expect(next.isBootstrapped).toBe(true);
  });

  it('stores an admin session with ADMIN role', () => {
    const session = makeSession({ role: Role.ADMIN });
    const next = reducer(initialState, sessionLoaded(session));

    expect(next.session?.user.role).toBe(Role.ADMIN);
  });

  it('stores a session where aiRequestsLimit is null (unlimited)', () => {
    const session = makeSession({ aiRequestsLimit: null });
    const next = reducer(initialState, sessionLoaded(session));

    expect(next.session?.user.aiRequestsLimit).toBeNull();
  });

  it('stores a session where mustChangePassword is true', () => {
    const session = makeSession({ mustChangePassword: true });
    const next = reducer(initialState, sessionLoaded(session));

    expect(next.session?.user.mustChangePassword).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// sessionCleared
// ---------------------------------------------------------------------------

describe('authSlice — sessionCleared', () => {
  it('clears an existing session', () => {
    const withSession = reducer(initialState, sessionLoaded(makeSession()));
    const next = reducer(withSession, sessionCleared());

    expect(next.session).toBeNull();
  });

  it('does not touch isBootstrapped when clearing', () => {
    const withSession = reducer(initialState, sessionLoaded(makeSession()));
    expect(withSession.isBootstrapped).toBe(true);

    const next = reducer(withSession, sessionCleared());
    expect(next.isBootstrapped).toBe(true);
  });

  it('is idempotent — clearing an already-null session stays null', () => {
    const next = reducer(initialState, sessionCleared());

    expect(next.session).toBeNull();
  });

  it('clearing twice in a row leaves state consistent', () => {
    const withSession = reducer(initialState, sessionLoaded(makeSession()));
    const first = reducer(withSession, sessionCleared());
    const second = reducer(first, sessionCleared());

    expect(second.session).toBeNull();
  });
});
