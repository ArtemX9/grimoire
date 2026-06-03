import { Platform } from '@grimoire/shared';

import type {
  AdminUserListResponse,
  AdminUserRow,
  AiGlobalSettings,
  PlatformTokenEntry,
  PlatformTokenInfo,
  UpdateAiGlobalArgs,
  UpdatePlatformTokenArgs,
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

export const adminFetchUsersPending = () => ({ type: ADMIN_FETCH_USERS_PENDING }) as const;
export const adminFetchUsersFulfilled = (payload: AdminUserListResponse) => ({ type: ADMIN_FETCH_USERS_FULFILLED, payload }) as const;
export const adminFetchUsersRejected = (error: string) => ({ type: ADMIN_FETCH_USERS_REJECTED, error }) as const;

export const adminFetchAiSettingsPending = () => ({ type: ADMIN_FETCH_AI_SETTINGS_PENDING }) as const;
export const adminFetchAiSettingsFulfilled = (payload: AiGlobalSettings) => ({ type: ADMIN_FETCH_AI_SETTINGS_FULFILLED, payload }) as const;
export const adminFetchAiSettingsRejected = (error: string) => ({ type: ADMIN_FETCH_AI_SETTINGS_REJECTED, error }) as const;

export const adminFetchPlatformsTokensPending = () => ({ type: ADMIN_FETCH_PLATFORMS_TOKENS_PENDING }) as const;
export const adminFetchPlatformsTokensFulfilled = (payload: PlatformTokenInfo) =>
  ({ type: ADMIN_FETCH_PLATFORMS_TOKENS_FULFILLED, payload }) as const;
export const adminFetchPlatformsTokensRejected = (error: string) => ({ type: ADMIN_FETCH_PLATFORMS_TOKENS_REJECTED, error }) as const;

export const adminCreateUserPending = () => ({ type: ADMIN_CREATE_USER_PENDING }) as const;
export const adminCreateUserFulfilled = (payload: AdminUserRow) => ({ type: ADMIN_CREATE_USER_FULFILLED, payload }) as const;
export const adminCreateUserRejected = (error: string) => ({ type: ADMIN_CREATE_USER_REJECTED, error }) as const;

export const adminDeleteUserFulfilled = (id: string) => ({ type: ADMIN_DELETE_USER_FULFILLED, meta: { arg: id } }) as const;

export const adminUpdateAiSettingsFulfilled = (arg: UpdateAiGlobalArgs) =>
  ({ type: ADMIN_UPDATE_AI_SETTINGS_FULFILLED, meta: { arg } }) as const;

export const adminUpdateUserAiSettingsFulfilled = (arg: UpdateUserAiArgs) =>
  ({ type: ADMIN_UPDATE_USER_AI_SETTINGS_FULFILLED, meta: { arg } }) as const;

export const adminUpdateUserPlanFulfilled = (payload: AdminUserRow) => ({ type: ADMIN_UPDATE_USER_PLAN_FULFILLED, payload }) as const;

export const adminUpdateUserRoleFulfilled = (payload: AdminUserRow) => ({ type: ADMIN_UPDATE_USER_ROLE_FULFILLED, payload }) as const;

export const adminUpdatePlatformTokenPending = (platformID: Platform) =>
  ({ type: ADMIN_UPDATE_PLATFORM_TOKEN_PENDING, meta: { arg: { platformID } } }) as const;
export const adminUpdatePlatformTokenFulfilled = (
  platformID: Platform,
  payload: { id: Platform; token: string; tokenValidityFrame: number; dateSet: Date },
) => ({ type: ADMIN_UPDATE_PLATFORM_TOKEN_FULFILLED, meta: { arg: { platformID } }, payload }) as const;
export const adminUpdatePlatformTokenRejected = (platformID: Platform) =>
  ({ type: ADMIN_UPDATE_PLATFORM_TOKEN_REJECTED, meta: { arg: { platformID } } }) as const;

export const adminTriggerUserSyncPending = () => ({ type: ADMIN_TRIGGER_USER_SYNC_PENDING }) as const;
export const adminTriggerUserSyncFulfilled = () => ({ type: ADMIN_TRIGGER_USER_SYNC_FULFILLED }) as const;
export const adminTriggerUserSyncRejected = (error: string) => ({ type: ADMIN_TRIGGER_USER_SYNC_REJECTED, error }) as const;

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
