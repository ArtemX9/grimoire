import { AsyncStatus } from '@grimoire/shared';
import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectCurrentUser = (state: RootState) => state.users.user;
export const selectUserStatus = (state: RootState) => state.users.status;
export const selectUserMutationStatus = (state: RootState) => state.users.mutationStatus;
export const selectUserError = (state: RootState) => state.users.error;

export const selectIsUserLoading = createSelector(selectUserStatus, (status) => status === AsyncStatus.Loading);

export const selectIsUserUpdating = createSelector(selectUserMutationStatus, (status) => status === AsyncStatus.Loading);
