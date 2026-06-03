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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sessionsReducer(state = initialState, rawAction: any): SessionsState {
  const action = rawAction as SessionsAction;
  switch (action.type) {
    // getRecentSessions
    case SESSIONS_GET_RECENT_PENDING:
      return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
    case SESSIONS_GET_RECENT_FULFILLED:
      return { ...state, fetchStatus: AsyncStatus.Succeeded, recentSessions: action.payload };
    case SESSIONS_GET_RECENT_REJECTED:
      return { ...state, fetchStatus: AsyncStatus.Failed, error: action.error };

    // getGameSessions
    case SESSIONS_GET_FOR_GAME_PENDING:
      return { ...state, fetchStatus: AsyncStatus.Loading, error: null };
    case SESSIONS_GET_FOR_GAME_FULFILLED: {
      const gameId = action.meta.arg.gameId;
      return {
        ...state,
        fetchStatus: AsyncStatus.Succeeded,
        gameSessions: { ...state.gameSessions, [gameId]: action.payload },
      };
    }
    case SESSIONS_GET_FOR_GAME_REJECTED:
      return { ...state, fetchStatus: AsyncStatus.Failed, error: action.error };

    // createSession
    case SESSIONS_CREATE_PENDING:
      return { ...state, createStatus: AsyncStatus.Loading, error: null };
    case SESSIONS_CREATE_FULFILLED: {
      const newSession = action.payload;
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
    case SESSIONS_CREATE_REJECTED:
      return { ...state, createStatus: AsyncStatus.Failed, error: action.error };

    default:
      return state;
  }
}

export default sessionsReducer;
