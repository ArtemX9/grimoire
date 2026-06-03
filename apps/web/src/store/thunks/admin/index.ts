import { Platform, PlatformUpdateResponse, PlatformsTokensResponse } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import {
  adminCreateUserFulfilled,
  adminCreateUserPending,
  adminCreateUserRejected,
  adminDeleteUserFulfilled,
  adminFetchAiSettingsFulfilled,
  adminFetchAiSettingsPending,
  adminFetchAiSettingsRejected,
  adminFetchPlatformsTokensFulfilled,
  adminFetchPlatformsTokensPending,
  adminFetchPlatformsTokensRejected,
  adminFetchUsersFulfilled,
  adminFetchUsersPending,
  adminFetchUsersRejected,
  adminTriggerUserSyncFulfilled,
  adminTriggerUserSyncPending,
  adminTriggerUserSyncRejected,
  adminUpdateAiSettingsFulfilled,
  adminUpdatePlatformTokenFulfilled,
  adminUpdatePlatformTokenPending,
  adminUpdatePlatformTokenRejected,
  adminUpdateUserAiSettingsFulfilled,
  adminUpdateUserPlanFulfilled,
  adminUpdateUserRoleFulfilled,
} from '@/store/actions/admin';
import type { AppThunk } from '@/store/store';

import type {
  AdminUserListResponse,
  AdminUserRow,
  AiGlobalSettings,
  CreateUserArgs,
  PlatformTokenInfo,
  SetupAdminArgs,
  TriggerUserSyncArgs,
  UpdateAiGlobalArgs,
  UpdatePlatformTokenArgs,
  UpdateUserAiArgs,
  UpdateUserPlanArgs,
  UpdateUserRoleArgs,
} from './types';

// ---------------------------------------------------------------------------
// fetchAdminUsers
// ---------------------------------------------------------------------------

export const fetchAdminUsers = (): AppThunk<Promise<AdminUserListResponse>> => async (dispatch) => {
  dispatch(adminFetchUsersPending());
  try {
    const data = await apiFetch<AdminUserListResponse>('/admin/users');
    dispatch(adminFetchUsersFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(adminFetchUsersRejected(message));
    throw new Error(message);
  }
};

// ---------------------------------------------------------------------------
// createAdminUser
// ---------------------------------------------------------------------------

export const createAdminUser =
  (body: CreateUserArgs): AppThunk<Promise<AdminUserRow>> =>
  async (dispatch) => {
    dispatch(adminCreateUserPending());
    try {
      const data = await apiFetch<AdminUserRow>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      dispatch(adminCreateUserFulfilled(data));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(adminCreateUserRejected(message));
      throw new Error(message);
    }
  };

// ---------------------------------------------------------------------------
// deleteAdminUser
// ---------------------------------------------------------------------------

export const deleteAdminUser =
  (id: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    try {
      await apiFetch<void>(`/admin/users/${id}`, { method: 'DELETE' });
      dispatch(adminDeleteUserFulfilled(id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  };

// ---------------------------------------------------------------------------
// fetchAiGlobalSettings
// ---------------------------------------------------------------------------

export const fetchAiGlobalSettings = (): AppThunk<Promise<AiGlobalSettings>> => async (dispatch) => {
  dispatch(adminFetchAiSettingsPending());
  try {
    const data = await apiFetch<AiGlobalSettings>('/admin/settings/ai');
    dispatch(adminFetchAiSettingsFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(adminFetchAiSettingsRejected(message));
    throw new Error(message);
  }
};

// ---------------------------------------------------------------------------
// updateAiGlobalSettings
// ---------------------------------------------------------------------------

export const updateAiGlobalSettings =
  (body: UpdateAiGlobalArgs): AppThunk<Promise<void>> =>
  async (dispatch) => {
    try {
      await apiFetch<void>('/admin/settings/ai', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      dispatch(adminUpdateAiSettingsFulfilled(body));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  };

// ---------------------------------------------------------------------------
// updateUserAiSettings
// ---------------------------------------------------------------------------

export const updateUserAiSettings =
  (args: UpdateUserAiArgs): AppThunk<Promise<void>> =>
  async (dispatch) => {
    const { id, ...body } = args;
    try {
      await apiFetch<void>(`/admin/users/${id}/ai`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      dispatch(adminUpdateUserAiSettingsFulfilled(args));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  };

// ---------------------------------------------------------------------------
// updateUserPlan
// ---------------------------------------------------------------------------

export const updateUserPlan =
  ({ id, plan }: UpdateUserPlanArgs): AppThunk<Promise<AdminUserRow>> =>
  async (dispatch) => {
    try {
      const data = await apiFetch<AdminUserRow>(`/admin/users/${id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ plan }),
      });
      dispatch(adminUpdateUserPlanFulfilled(data));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  };

// ---------------------------------------------------------------------------
// updateUserRole
// ---------------------------------------------------------------------------

export const updateUserRole =
  ({ userID, role }: UpdateUserRoleArgs): AppThunk<Promise<AdminUserRow>> =>
  async (dispatch) => {
    try {
      const data = await apiFetch<AdminUserRow>(`/admin/users/${userID}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      dispatch(adminUpdateUserRoleFulfilled(data));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  };

// ---------------------------------------------------------------------------
// fetchPlatformsTokens
// ---------------------------------------------------------------------------

export const fetchPlatformsTokens = (): AppThunk<Promise<PlatformTokenInfo>> => async (dispatch) => {
  dispatch(adminFetchPlatformsTokensPending());
  try {
    const raw = await apiFetch<PlatformsTokensResponse>('/admin/settings/platforms');
    const data = raw.reduce((acc, platform) => {
      acc[platform.id] = {
        isLoading: false,
        token: platform.token,
        tokenValidityFrame: platform.tokenValidityFrame,
        dateSet: platform.dateSet,
      };
      return acc;
    }, {} as PlatformTokenInfo);
    dispatch(adminFetchPlatformsTokensFulfilled(data));
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    dispatch(adminFetchPlatformsTokensRejected(message));
    throw new Error(message);
  }
};

// ---------------------------------------------------------------------------
// updatePlatformToken
// ---------------------------------------------------------------------------

export const updatePlatformToken =
  ({ platformID, ...body }: UpdatePlatformTokenArgs): AppThunk<Promise<PlatformUpdateResponse>> =>
  async (dispatch) => {
    dispatch(adminUpdatePlatformTokenPending(platformID));
    try {
      const data = await apiFetch<PlatformUpdateResponse>(`/admin/settings/platforms/${platformID}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      dispatch(adminUpdatePlatformTokenFulfilled(platformID, data));
      return data;
    } catch (err) {
      dispatch(adminUpdatePlatformTokenRejected(platformID));
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  };

// ---------------------------------------------------------------------------
// setupAdmin
// ---------------------------------------------------------------------------

export const setupAdmin =
  (body: SetupAdminArgs): AppThunk<Promise<AdminUserRow>> =>
  async (_dispatch) => {
    try {
      const data = await apiFetch<AdminUserRow>('/admin/setup', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Setup failed');
    }
  };

// ---------------------------------------------------------------------------
// triggerUserSync
// ---------------------------------------------------------------------------

export const triggerUserSync =
  ({ userID }: TriggerUserSyncArgs): AppThunk<Promise<void>> =>
  async (dispatch) => {
    dispatch(adminTriggerUserSyncPending());
    try {
      await apiFetch<void>(`/admin/users/${userID}/sync`, { method: 'POST' });
      dispatch(adminTriggerUserSyncFulfilled());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(adminTriggerUserSyncRejected(message));
      throw new Error(message);
    }
  };
