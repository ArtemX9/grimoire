import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectRecentSessions = (state: RootState) => state.sessions.recentSessions;
export const selectGameSessions = (state: RootState) => state.sessions.gameSessions;
export const selectSessionsFetchStatus = (state: RootState) => state.sessions.fetchStatus;
export const selectSessionsCreateStatus = (state: RootState) => state.sessions.createStatus;
export const selectSessionsError = (state: RootState) => state.sessions.error;

export function selectSessionsByGameId(gameId: string) {
  return createSelector(selectGameSessions, (gameSessions) => gameSessions[gameId] ?? []);
}
