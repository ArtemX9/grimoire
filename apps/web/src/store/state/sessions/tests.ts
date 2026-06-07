import { AsyncStatus } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import {
  SESSIONS_CREATE_FULFILLED,
  SESSIONS_GET_FOR_GAME_FULFILLED,
  SESSIONS_GET_RECENT_FULFILLED,
  SESSIONS_GET_RECENT_PENDING,
  SESSIONS_GET_RECENT_REJECTED,
  sessionsCreateFulfilled,
  sessionsGetForGameFulfilled,
  sessionsGetRecentFulfilled,
  sessionsGetRecentPending,
  sessionsGetRecentRejected,
} from '@/store/actions/sessions';
import reducer, { SESSIONS_SLICE, SessionsState } from '@/store/state/sessions/index';
import { selectRecentSessions, selectSessionsByGameId, selectSessionsFetchStatus } from '@/store/state/sessions/selectors';
import { generatePlaySession } from '@/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' } as never);

function makeRootState(overrides: Partial<SessionsState> = {}) {
  return { [SESSIONS_SLICE]: { ...initialState, ...overrides } };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('sessionsSlice — initial state', () => {
  it('has empty recentSessions', () => {
    expect(initialState.recentSessions).toEqual([]);
  });

  it('has empty gameSessions record', () => {
    expect(initialState.gameSessions).toEqual({});
  });

  it('has Idle fetchStatus', () => {
    expect(initialState.fetchStatus).toBe(AsyncStatus.Idle);
  });
});

// ---------------------------------------------------------------------------
// Thunk type constants
// ---------------------------------------------------------------------------

describe('sessions action type constants', () => {
  it('getRecentSessions has correct type strings', () => {
    expect(SESSIONS_GET_RECENT_PENDING).toBe('sessions/getRecent/pending');
    expect(SESSIONS_GET_RECENT_FULFILLED).toBe('sessions/getRecent/fulfilled');
    expect(SESSIONS_GET_RECENT_REJECTED).toBe('sessions/getRecent/rejected');
  });

  it('getGameSessions has correct type strings', () => {
    expect(SESSIONS_GET_FOR_GAME_FULFILLED).toBe('sessions/getForGame/fulfilled');
  });

  it('createSession has correct type strings', () => {
    expect(SESSIONS_CREATE_FULFILLED).toBe('sessions/create/fulfilled');
  });
});

// ---------------------------------------------------------------------------
// getRecentSessions lifecycle
// ---------------------------------------------------------------------------

describe('sessionsSlice — getRecentSessions', () => {
  it('sets fetchStatus to Loading on pending', () => {
    const next = reducer(initialState, sessionsGetRecentPending());
    expect(next.fetchStatus).toBe(AsyncStatus.Loading);
  });

  it('sets recentSessions and Succeeded on fulfilled', () => {
    const sessions = [generatePlaySession(), generatePlaySession()];
    const next = reducer(initialState, sessionsGetRecentFulfilled(sessions));
    expect(next.recentSessions).toHaveLength(2);
    expect(next.fetchStatus).toBe(AsyncStatus.Succeeded);
  });

  it('sets Failed on rejected', () => {
    const next = reducer(initialState, sessionsGetRecentRejected('Server error'));
    expect(next.fetchStatus).toBe(AsyncStatus.Failed);
    expect(next.error).toBe('Server error');
  });
});

// ---------------------------------------------------------------------------
// getGameSessions lifecycle
// ---------------------------------------------------------------------------

describe('sessionsSlice — getGameSessions', () => {
  it('stores sessions keyed by gameId', () => {
    const gameId = 'game-1';
    const sessions = [generatePlaySession({ gameID: gameId })];
    const next = reducer(initialState, sessionsGetForGameFulfilled(gameId, sessions));
    expect(next.gameSessions[gameId]).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// createSession lifecycle
// ---------------------------------------------------------------------------

describe('sessionsSlice — createSession', () => {
  it('prepends new session to recentSessions', () => {
    const existing = generatePlaySession();
    const withSessions = reducer(initialState, sessionsGetRecentFulfilled([existing]));
    const newSession = generatePlaySession();
    const next = reducer(withSessions, sessionsCreateFulfilled(newSession));
    expect(next.recentSessions[0]).toEqual(newSession);
    expect(next.recentSessions).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('sessions selectors', () => {
  it('selectRecentSessions returns recentSessions', () => {
    const session = generatePlaySession();
    const state = makeRootState({ recentSessions: [session] });
    expect(selectRecentSessions(state as never)).toHaveLength(1);
  });

  it('selectSessionsByGameId returns sessions for a given gameId', () => {
    const gameId = 'game-abc';
    const session = generatePlaySession({ gameID: gameId });
    const state = makeRootState({ gameSessions: { [gameId]: [session] } });
    const selector = selectSessionsByGameId(gameId);
    expect(selector(state as never)).toHaveLength(1);
  });

  it('selectSessionsByGameId returns empty array for unknown gameId', () => {
    const state = makeRootState({ gameSessions: {} });
    const selector = selectSessionsByGameId('unknown-game');
    expect(selector(state as never)).toEqual([]);
  });

  it('selectSessionsFetchStatus returns fetchStatus', () => {
    const state = makeRootState({ fetchStatus: AsyncStatus.Loading });
    expect(selectSessionsFetchStatus(state as never)).toBe(AsyncStatus.Loading);
  });
});
