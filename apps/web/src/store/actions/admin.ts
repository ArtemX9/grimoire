import { Platform } from '@grimoire/shared';

import type {
  AdminUserListResponse,
  AdminUserRow,
  AiGlobalSettings,
  PlatformTokenInfo,
  UpdateAiGlobalArgs,
  UpdateUserAiArgs,
} from '@/store/thunks/admin/types';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const ADMIN_FETCH_USERS_PENDING = 'admin/fetchUsers/pending';
export const ADMIN_FETCH_USERS_FULFILLED = 'admin/fetchUsers/fulfilled';
export const ADMIN_FETCH_USERS_REJECTED = 'admin/fetchUsers/rejected';

export const ADMIN_FETCH_AI_SETTINGS_PENDING = 'admin/fetchAiGlobalSettings/pending';
export const ADMIN_FETCH_AI_SETTINGS_FULFILLED = 'admin/fetchAiGlobalSettings/fulfilled';
export const ADMIN_FETCH_AI_SETTINGS_REJECTED = 'admin/fetchAiGlobalSettings/rejected';

export const ADMIN_FETCH_PLATFORMS_TOKENS_PENDING = 'admin/fetchPlatformsTokens/pending';
export const ADMIN_FETCH_PLATFORMS_TOKENS_FULFILLED = 'admin/fetchPlatformsTokens/fulfilled';
export const ADMIN_FETCH_PLATFORMS_TOKENS_REJECTED = 'admin/fetchPlatformsTokens/rejected';

export const ADMIN_CREATE_USER_PENDING = 'admin/createUser/pending';
export const ADMIN_CREATE_USER_FULFILLED = 'admin/createUser/fulfilled';
export const ADMIN_CREATE_USER_REJECTED = 'admin/createUser/rejected';

export const ADMIN_DELETE_USER_FULFILLED = 'admin/deleteUser/fulfilled';

export const ADMIN_UPDATE_AI_SETTINGS_FULFILLED = 'admin/updateAiGlobalSettings/fulfilled';
export const ADMIN_UPDATE_USER_AI_SETTINGS_FULFILLED = 'admin/updateUserAiSettings/fulfilled';

export const ADMIN_UPDATE_USER_PLAN_FULFILLED = 'admin/updateUserPlan/fulfilled';
export const ADMIN_UPDATE_USER_ROLE_FULFILLED = 'admin/updateUserRole/fulfilled';

export const ADMIN_UPDATE_PLATFORM_TOKEN_PENDING = 'admin/updatePlatformToken/pending';
export const ADMIN_UPDATE_PLATFORM_TOKEN_FULFILLED = 'admin/updatePlatformToken/fulfilled';
export const ADMIN_UPDATE_PLATFORM_TOKEN_REJECTED = 'admin/updatePlatformToken/rejected';

export const ADMIN_TRIGGER_USER_SYNC_PENDING = 'admin/triggerUserSync/pending';
export const ADMIN_TRIGGER_USER_SYNC_FULFILLED = 'admin/triggerUserSync/fulfilled';
export const ADMIN_TRIGGER_USER_SYNC_REJECTED = 'admin/triggerUserSync/rejected';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const adminFetchUsersPending = () => ({ type: ADMIN_FETCH_USERS_PENDING, payload: {} });
export const adminFetchUsersFulfilled = (adminUser: AdminUserListResponse) => ({
  type: ADMIN_FETCH_USERS_FULFILLED,
  payload: { adminUser },
});
export const adminFetchUsersRejected = (error: string) => ({ type: ADMIN_FETCH_USERS_REJECTED, payload: { error } });

export const adminFetchAiSettingsPending = () => ({ type: ADMIN_FETCH_AI_SETTINGS_PENDING, payload: {} });
export const adminFetchAiSettingsFulfilled = (aiGlobalSettings: AiGlobalSettings) => ({
  type: ADMIN_FETCH_AI_SETTINGS_FULFILLED,
  payload: { aiGlobalSettings },
});
export const adminFetchAiSettingsRejected = (error: string) => ({ type: ADMIN_FETCH_AI_SETTINGS_REJECTED, payload: { error } });

export const adminFetchPlatformsTokensPending = () => ({ type: ADMIN_FETCH_PLATFORMS_TOKENS_PENDING, payload: {} });
export const adminFetchPlatformsTokensFulfilled = (playformTokenInfo: PlatformTokenInfo) => ({
  type: ADMIN_FETCH_PLATFORMS_TOKENS_FULFILLED,
  payload: { playformTokenInfo },
});
export const adminFetchPlatformsTokensRejected = (error: string) => ({ type: ADMIN_FETCH_PLATFORMS_TOKENS_REJECTED, payload: { error } });

export const adminCreateUserPending = () => ({ type: ADMIN_CREATE_USER_PENDING, payload: {} });
export const adminCreateUserFulfilled = (adminUserRow: AdminUserRow) => ({ type: ADMIN_CREATE_USER_FULFILLED, payload: { adminUserRow } });
export const adminCreateUserRejected = (error: string) => ({ type: ADMIN_CREATE_USER_REJECTED, payload: { error } });

export const adminDeleteUserFulfilled = (id: string) => ({ type: ADMIN_DELETE_USER_FULFILLED, payload: { id } });

export const adminUpdateAiSettingsFulfilled = (globalAIArgs: UpdateAiGlobalArgs) => ({
  type: ADMIN_UPDATE_AI_SETTINGS_FULFILLED,
  payload: { globalAIArgs },
});

export const adminUpdateUserAiSettingsFulfilled = (userAIArgs: UpdateUserAiArgs) => ({
  type: ADMIN_UPDATE_USER_AI_SETTINGS_FULFILLED,
  payload: { userAIArgs },
});

export const adminUpdateUserPlanFulfilled = (adminUserRow: AdminUserRow) => ({
  type: ADMIN_UPDATE_USER_PLAN_FULFILLED,
  payload: { adminUserRow },
});

export const adminUpdateUserRoleFulfilled = (adminUserRow: AdminUserRow) => ({
  type: ADMIN_UPDATE_USER_ROLE_FULFILLED,
  payload: { adminUserRow },
});

export const adminUpdatePlatformTokenPending = (platformID: Platform) => ({
  type: ADMIN_UPDATE_PLATFORM_TOKEN_PENDING,
  payload: { platformID },
});
export const adminUpdatePlatformTokenFulfilled = (
  platformID: Platform,
  payload: { id: Platform; token: string; tokenValidityFrame: number; dateSet: Date },
) => ({ type: ADMIN_UPDATE_PLATFORM_TOKEN_FULFILLED, meta: { arg: { platformID } }, payload });
export const adminUpdatePlatformTokenRejected = (platformID: Platform) => ({
  type: ADMIN_UPDATE_PLATFORM_TOKEN_REJECTED,
  meta: { arg: { platformID } },
});

export const adminTriggerUserSyncPending = () => ({ type: ADMIN_TRIGGER_USER_SYNC_PENDING, payload: {} });
export const adminTriggerUserSyncFulfilled = () => ({ type: ADMIN_TRIGGER_USER_SYNC_FULFILLED, payload: {} });
export const adminTriggerUserSyncRejected = (error: string) => ({ type: ADMIN_TRIGGER_USER_SYNC_REJECTED, payload: { error } });

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type AdminAction =
  | ReturnType<typeof adminFetchUsersPending>
  | ReturnType<typeof adminFetchUsersFulfilled>
  | ReturnType<typeof adminFetchUsersRejected>
  | ReturnType<typeof adminFetchAiSettingsPending>
  | ReturnType<typeof adminFetchAiSettingsFulfilled>
  | ReturnType<typeof adminFetchAiSettingsRejected>
  | ReturnType<typeof adminFetchPlatformsTokensPending>
  | ReturnType<typeof adminFetchPlatformsTokensFulfilled>
  | ReturnType<typeof adminFetchPlatformsTokensRejected>
  | ReturnType<typeof adminCreateUserPending>
  | ReturnType<typeof adminCreateUserFulfilled>
  | ReturnType<typeof adminCreateUserRejected>
  | ReturnType<typeof adminDeleteUserFulfilled>
  | ReturnType<typeof adminUpdateAiSettingsFulfilled>
  | ReturnType<typeof adminUpdateUserAiSettingsFulfilled>
  | ReturnType<typeof adminUpdateUserPlanFulfilled>
  | ReturnType<typeof adminUpdateUserRoleFulfilled>
  | ReturnType<typeof adminUpdatePlatformTokenPending>
  | ReturnType<typeof adminUpdatePlatformTokenFulfilled>
  | ReturnType<typeof adminUpdatePlatformTokenRejected>
  | ReturnType<typeof adminTriggerUserSyncPending>
  | ReturnType<typeof adminTriggerUserSyncFulfilled>
  | ReturnType<typeof adminTriggerUserSyncRejected>;
