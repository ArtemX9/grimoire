import { AsyncStatus, Role } from '@grimoire/shared';
import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectSession = (state: RootState) => state.auth.session;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectIsBootstrapped = (state: RootState) => state.auth.isBootstrapped;
export const selectAuthError = (state: RootState) => state.auth.error;

export const selectIsAuthenticated = createSelector(selectSession, (session) => session !== null);

export const selectCurrentUserId = createSelector(selectSession, (session) => session?.user.id ?? null);

export const selectIsAdmin = createSelector(selectSession, (session) => session?.user.role === Role.ADMIN);

export const selectAiEnabled = createSelector(selectSession, (session) => session?.user.aiEnabled ?? false);

export const selectMustChangePassword = createSelector(selectSession, (session) => session?.user.mustChangePassword ?? false);

export const selectIsAuthLoading = createSelector(selectAuthStatus, (status) => status === AsyncStatus.Loading);
