import { AsyncStatus, Platform } from '@grimoire/shared';
import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectAdminUsers = (state: RootState) => state.admin.users;
export const selectAdminUsersTotal = (state: RootState) => state.admin.usersTotal;
export const selectAiSettings = (state: RootState) => state.admin.aiSettings;
export const selectPlatformsTokens = (state: RootState) => state.admin.platformsTokens;
export const selectAdminUsersStatus = (state: RootState) => state.admin.usersStatus;
export const selectAdminPlatformsTokensStatus = (state: RootState) => state.admin.platformsTokensStatus;
export const selectAdminMutationStatus = (state: RootState) => state.admin.mutationStatus;
export const selectAdminError = (state: RootState) => state.admin.error;

export const selectIsAdminUsersLoading = createSelector(selectAdminUsersStatus, (status) => status === AsyncStatus.Loading);

export const selectGlobalAiEnabled = createSelector(selectAiSettings, (settings) => settings?.aiEnabled ?? true);
