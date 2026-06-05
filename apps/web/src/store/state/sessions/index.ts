import { AsyncStatus, PlaySession } from '@grimoire/shared';

import {
  SESSIONS_CREATE_FULFILLED,
  SESSIONS_CREATE_PENDING,
  SESSIONS_CREATE_REJECTED,
  SESSIONS_GET_FOR_GAME_FULFILLED,
  SESSIONS_GET_FOR_GAME_PENDING,
  SESSIONS_GET_FOR_GAME_REJECTED,
  SESSIONS_GET_RECENT_FULFILLED,
  SESSIONS_GET_RECENT_PENDING,
  SESSIONS_GET_RECENT_REJECTED,
  type SessionsAction,
  sessionsCreateFulfilled,
  sessionsCreatePending,
  sessionsCreateRejected,
  sessionsGetForGameFulfilled,
  sessionsGetForGamePending,
  sessionsGetForGameRejected,
  sessionsGetRecentFulfilled,
  sessionsGetRecentPending,
  sessionsGetRecentRejected,
} from '@/store/actions/sessions';

export const SESSIONS_SLICE = 'sessions';

export interface SessionsState {
  recentSessions: PlaySession[];
  gameSessions: Record<string, PlaySession[]>;
  createStatus: AsyncStatus;
  fetchStatus: AsyncStatus;
  error: string | null;
}

const initialState: SessionsState = {
  recentSessions: [],
  gameSessions: {},
  createStatus: AsyncStatus.Idle,
  fetchStatus: AsyncStatus.Idle,
  error: null,
};

export function sessionsReducer(state = initialState, action: SessionsAction): SessionsState {
  switch (action.type) {
    // getRecentSessions
    case SESSIONS_GET_RECENT_PENDING:
      return handleSessionsGetRecentStart(state, action as ReturnType<typeof sessionsGetRecentPending>);
    case SESSIONS_GET_RECENT_FULFILLED:
      return handleSessionsGetRecentSuccess(state, action as ReturnType<typeof sessionsGetRecentFulfilled>);
    case SESSIONS_GET_RECENT_REJECTED:
      return handleSessionsGetRecentFailure(state, action as ReturnType<typeof sessionsGetRecentRejected>);

    // getGameSessions
    case SESSIONS_GET_FOR_GAME_PENDING:
      return handleSessionsGetForGameStart(state, action as ReturnType<typeof sessionsGetForGamePending>);
    case SESSIONS_GET_FOR_GAME_FULFILLED:
      return handleSessionsGetForGameSuccess(state, action as ReturnType<typeof sessionsGetForGameFulfilled>);
    case SESSIONS_GET_FOR_GAME_REJECTED:
      return handleSessionsGetForGameFailure(state, action as ReturnType<typeof sessionsGetForGameRejected>);

    // createSession
    case SESSIONS_CREATE_PENDING:
      return handleSessionsCreateStart(state, action as ReturnType<typeof sessionsCreatePending>);
    case SESSIONS_CREATE_FULFILLED:
      return handleSessionsCreateSuccess(state, action as ReturnType<typeof sessionsCreateFulfilled>);
    case SESSIONS_CREATE_REJECTED:
      return handleSessionsCreateFailure(state, action as ReturnType<typeof sessionsCreateRejected>);

    default:
      return state;
  }
}

// getRecentSessions
function handleSessionsGetRecentStart(state: SessionsState, _action: ReturnType<typeof sessionsGetRecentPending>): SessionsState {
  return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
}
function handleSessionsGetRecentSuccess(state: SessionsState, action: ReturnType<typeof sessionsGetRecentFulfilled>): SessionsState {
  return { ...state, fetchStatus: AsyncStatus.Succeeded, recentSessions: action.payload.sessions };
}
function handleSessionsGetRecentFailure(state: SessionsState, action: ReturnType<typeof sessionsGetRecentRejected>): SessionsState {
  return { ...state, fetchStatus: AsyncStatus.Failed, error: action.payload.error };
}

// getGameSessions
function handleSessionsGetForGameStart(state: SessionsState, _action: ReturnType<typeof sessionsGetForGamePending>): SessionsState {
  return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
}
function handleSessionsGetForGameSuccess(state: SessionsState, action: ReturnType<typeof sessionsGetForGameFulfilled>): SessionsState {
  const { gameId, sessions } = action.payload;
  return {
    ...state,
    fetchStatus: AsyncStatus.Succeeded,
    gameSessions: { ...state.gameSessions, [gameId]: sessions },
  };
}
function handleSessionsGetForGameFailure(state: SessionsState, action: ReturnType<typeof sessionsGetForGameRejected>): SessionsState {
  return { ...state, fetchStatus: AsyncStatus.Failed, error: action.payload.error };
}

// createSession
function handleSessionsCreateStart(state: SessionsState, _action: ReturnType<typeof sessionsCreatePending>): SessionsState {
  return { ...state, createStatus: AsyncStatus.Loading, error: null };
}
function handleSessionsCreateSuccess(state: SessionsState, action: ReturnType<typeof sessionsCreateFulfilled>): SessionsState {
  const newSession = action.payload.session;
  const updatedGameSessions = state.gameSessions[newSession.gameID]
    ? { ...state.gameSessions, [newSession.gameID]: [newSession, ...state.gameSessions[newSession.gameID]] }
    : state.gameSessions;
  return {
    ...state,
    createStatus: AsyncStatus.Succeeded,
    recentSessions: [newSession, ...state.recentSessions],
    gameSessions: updatedGameSessions,
  };
}
function handleSessionsCreateFailure(state: SessionsState, action: ReturnType<typeof sessionsCreateRejected>): SessionsState {
  return { ...state, createStatus: AsyncStatus.Failed, error: action.payload.error };
}

export default sessionsReducer;
