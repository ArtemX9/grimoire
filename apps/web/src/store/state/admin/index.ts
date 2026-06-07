import { AsyncStatus, Platform } from '@grimoire/shared';

import {
  ADMIN_CREATE_USER_FULFILLED,
  ADMIN_CREATE_USER_PENDING,
  ADMIN_CREATE_USER_REJECTED,
  ADMIN_DELETE_USER_FULFILLED,
  ADMIN_FETCH_AI_SETTINGS_FULFILLED,
  ADMIN_FETCH_AI_SETTINGS_PENDING,
  ADMIN_FETCH_AI_SETTINGS_REJECTED,
  ADMIN_FETCH_PLATFORMS_TOKENS_FULFILLED,
  ADMIN_FETCH_PLATFORMS_TOKENS_PENDING,
  ADMIN_FETCH_PLATFORMS_TOKENS_REJECTED,
  ADMIN_FETCH_USERS_FULFILLED,
  ADMIN_FETCH_USERS_PENDING,
  ADMIN_FETCH_USERS_REJECTED,
  ADMIN_TRIGGER_USER_SYNC_FULFILLED,
  ADMIN_TRIGGER_USER_SYNC_PENDING,
  ADMIN_TRIGGER_USER_SYNC_REJECTED,
  ADMIN_UPDATE_AI_SETTINGS_FULFILLED,
  ADMIN_UPDATE_PLATFORM_TOKEN_FULFILLED,
  ADMIN_UPDATE_PLATFORM_TOKEN_PENDING,
  ADMIN_UPDATE_PLATFORM_TOKEN_REJECTED,
  ADMIN_UPDATE_USER_AI_SETTINGS_FULFILLED,
  ADMIN_UPDATE_USER_PLAN_FULFILLED,
  ADMIN_UPDATE_USER_ROLE_FULFILLED,
  type AdminAction,
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
import type { AdminUserRow, AiGlobalSettings, PlatformTokenInfo } from '@/store/thunks/admin/types';

export const ADMIN_SLICE = 'admin';

export interface AdminState {
  users: AdminUserRow[];
  usersTotal: number;
  aiSettings: AiGlobalSettings | null;
  platformsTokens: PlatformTokenInfo;
  platformLoadingStates: Partial<Record<Platform, boolean>>;
  usersStatus: AsyncStatus;
  aiSettingsStatus: AsyncStatus;
  platformsTokensStatus: AsyncStatus;
  mutationStatus: AsyncStatus;
  error: string | null;
}

const initialState: AdminState = {
  users: [],
  usersTotal: 0,
  aiSettings: null,
  platformsTokens: {},
  platformLoadingStates: {},
  usersStatus: AsyncStatus.Idle,
  aiSettingsStatus: AsyncStatus.Idle,
  platformsTokensStatus: AsyncStatus.Idle,
  mutationStatus: AsyncStatus.Idle,
  error: null,
};

export function adminReducer(state = initialState, action: AdminAction): AdminState {
  switch (action.type) {
    // fetchAdminUsers
    case ADMIN_FETCH_USERS_PENDING:
      return handleAdminFetchUsersStart(state, action as ReturnType<typeof adminFetchUsersPending>);
    case ADMIN_FETCH_USERS_FULFILLED:
      return handleAdminFetchUsersSuccess(state, action as ReturnType<typeof adminFetchUsersFulfilled>);
    case ADMIN_FETCH_USERS_REJECTED:
      return handleAdminFetchUsersFailure(state, action as ReturnType<typeof adminFetchUsersRejected>);

    // fetchAiGlobalSettings
    case ADMIN_FETCH_AI_SETTINGS_PENDING:
      return handleAdminFetchAiSettingsStart(state, action as ReturnType<typeof adminFetchAiSettingsPending>);
    case ADMIN_FETCH_AI_SETTINGS_FULFILLED:
      return handleAdminFetchAiSettingsSuccess(state, action as ReturnType<typeof adminFetchAiSettingsFulfilled>);
    case ADMIN_FETCH_AI_SETTINGS_REJECTED:
      return handleAdminFetchAiSettingsFailure(state, action as ReturnType<typeof adminFetchAiSettingsRejected>);

    // fetchPlatformsTokens
    case ADMIN_FETCH_PLATFORMS_TOKENS_PENDING:
      return handleAdminFetchPlatformsTokensStart(state, action as ReturnType<typeof adminFetchPlatformsTokensPending>);
    case ADMIN_FETCH_PLATFORMS_TOKENS_FULFILLED:
      return handleAdminFetchPlatformsTokensSuccess(state, action as ReturnType<typeof adminFetchPlatformsTokensFulfilled>);
    case ADMIN_FETCH_PLATFORMS_TOKENS_REJECTED:
      return handleAdminFetchPlatformsTokensFailure(state, action as ReturnType<typeof adminFetchPlatformsTokensRejected>);

    // createAdminUser
    case ADMIN_CREATE_USER_PENDING:
      return handleAdminCreateUserStart(state, action as ReturnType<typeof adminCreateUserPending>);
    case ADMIN_CREATE_USER_FULFILLED:
      return handleAdminCreateUserSuccess(state, action as ReturnType<typeof adminCreateUserFulfilled>);
    case ADMIN_CREATE_USER_REJECTED:
      return handleAdminCreateUserFailure(state, action as ReturnType<typeof adminCreateUserRejected>);

    // deleteAdminUser
    case ADMIN_DELETE_USER_FULFILLED:
      return handleAdminDeleteUserSuccess(state, action as ReturnType<typeof adminDeleteUserFulfilled>);

    // updateAiGlobalSettings
    case ADMIN_UPDATE_AI_SETTINGS_FULFILLED:
      return handleAdminUpdateAiSettingsSuccess(state, action as ReturnType<typeof adminUpdateAiSettingsFulfilled>);

    // updateUserAiSettings
    case ADMIN_UPDATE_USER_AI_SETTINGS_FULFILLED:
      return handleAdminUpdateUserAiSettingsSuccess(state, action as ReturnType<typeof adminUpdateUserAiSettingsFulfilled>);

    // updateUserPlan
    case ADMIN_UPDATE_USER_PLAN_FULFILLED:
      return handleAdminUpdateUserPlanSuccess(state, action as ReturnType<typeof adminUpdateUserPlanFulfilled>);

    // updateUserRole
    case ADMIN_UPDATE_USER_ROLE_FULFILLED:
      return handleAdminUpdateUserRoleSuccess(state, action as ReturnType<typeof adminUpdateUserRoleFulfilled>);

    // updatePlatformToken
    case ADMIN_UPDATE_PLATFORM_TOKEN_PENDING:
      return handleAdminUpdatePlatformTokenStart(state, action as ReturnType<typeof adminUpdatePlatformTokenPending>);
    case ADMIN_UPDATE_PLATFORM_TOKEN_FULFILLED:
      return handleAdminUpdatePlatformTokenSuccess(state, action as ReturnType<typeof adminUpdatePlatformTokenFulfilled>);
    case ADMIN_UPDATE_PLATFORM_TOKEN_REJECTED:
      return handleAdminUpdatePlatformTokenFailure(state, action as ReturnType<typeof adminUpdatePlatformTokenRejected>);

    // triggerUserSync
    case ADMIN_TRIGGER_USER_SYNC_PENDING:
      return handleAdminTriggerUserSyncStart(state, action as ReturnType<typeof adminTriggerUserSyncPending>);
    case ADMIN_TRIGGER_USER_SYNC_FULFILLED:
      return handleAdminTriggerUserSyncSuccess(state, action as ReturnType<typeof adminTriggerUserSyncFulfilled>);
    case ADMIN_TRIGGER_USER_SYNC_REJECTED:
      return handleAdminTriggerUserSyncFailure(state, action as ReturnType<typeof adminTriggerUserSyncRejected>);

    default:
      return state;
  }
}

// fetchAdminUsers
function handleAdminFetchUsersStart(state: AdminState, _action: ReturnType<typeof adminFetchUsersPending>): AdminState {
  return { ...state, usersStatus: AsyncStatus.Loading, error: null };
}
function handleAdminFetchUsersSuccess(state: AdminState, action: ReturnType<typeof adminFetchUsersFulfilled>): AdminState {
  return {
    ...state,
    usersStatus: AsyncStatus.Succeeded,
    users: action.payload.adminUser.data,
    usersTotal: action.payload.adminUser.total,
  };
}
function handleAdminFetchUsersFailure(state: AdminState, action: ReturnType<typeof adminFetchUsersRejected>): AdminState {
  return { ...state, usersStatus: AsyncStatus.Failed, error: action.payload.error };
}

// fetchAiGlobalSettings
function handleAdminFetchAiSettingsStart(state: AdminState, _action: ReturnType<typeof adminFetchAiSettingsPending>): AdminState {
  return { ...state, aiSettingsStatus: AsyncStatus.Loading, error: null };
}
function handleAdminFetchAiSettingsSuccess(state: AdminState, action: ReturnType<typeof adminFetchAiSettingsFulfilled>): AdminState {
  return { ...state, aiSettingsStatus: AsyncStatus.Succeeded, aiSettings: action.payload.aiGlobalSettings };
}
function handleAdminFetchAiSettingsFailure(state: AdminState, action: ReturnType<typeof adminFetchAiSettingsRejected>): AdminState {
  return { ...state, aiSettingsStatus: AsyncStatus.Failed, error: action.payload.error };
}

// fetchPlatformsTokens
function handleAdminFetchPlatformsTokensStart(state: AdminState, _action: ReturnType<typeof adminFetchPlatformsTokensPending>): AdminState {
  return { ...state, platformsTokensStatus: AsyncStatus.Loading, error: null };
}
function handleAdminFetchPlatformsTokensSuccess(state: AdminState, action: ReturnType<typeof adminFetchPlatformsTokensFulfilled>): AdminState {
  return { ...state, platformsTokensStatus: AsyncStatus.Succeeded, platformsTokens: action.payload.playformTokenInfo };
}
function handleAdminFetchPlatformsTokensFailure(state: AdminState, action: ReturnType<typeof adminFetchPlatformsTokensRejected>): AdminState {
  return { ...state, platformsTokensStatus: AsyncStatus.Failed, error: action.payload.error };
}

// createAdminUser
function handleAdminCreateUserStart(state: AdminState, _action: ReturnType<typeof adminCreateUserPending>): AdminState {
  return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
}
function handleAdminCreateUserSuccess(state: AdminState, action: ReturnType<typeof adminCreateUserFulfilled>): AdminState {
  return {
    ...state,
    mutationStatus: AsyncStatus.Succeeded,
    users: [action.payload.adminUserRow, ...state.users],
    usersTotal: state.usersTotal + 1,
  };
}
function handleAdminCreateUserFailure(state: AdminState, action: ReturnType<typeof adminCreateUserRejected>): AdminState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

// deleteAdminUser
function handleAdminDeleteUserSuccess(state: AdminState, action: ReturnType<typeof adminDeleteUserFulfilled>): AdminState {
  return {
    ...state,
    users: state.users.filter((u) => u.id !== action.payload.id),
    usersTotal: Math.max(0, state.usersTotal - 1),
  };
}

// updateAiGlobalSettings
function handleAdminUpdateAiSettingsSuccess(state: AdminState, action: ReturnType<typeof adminUpdateAiSettingsFulfilled>): AdminState {
  if (!state.aiSettings) return state;
  return { ...state, aiSettings: { ...state.aiSettings, aiEnabled: action.payload.globalAIArgs.aiEnabled } };
}

// updateUserAiSettings
function handleAdminUpdateUserAiSettingsSuccess(state: AdminState, action: ReturnType<typeof adminUpdateUserAiSettingsFulfilled>): AdminState {
  const { id, aiEnabled, aiRequestsLimit } = action.payload.userAIArgs;
  return {
    ...state,
    users: state.users.map((u) => (u.id === id ? { ...u, aiEnabled, aiRequestsLimit } : u)),
  };
}

// updateUserPlan
function handleAdminUpdateUserPlanSuccess(state: AdminState, action: ReturnType<typeof adminUpdateUserPlanFulfilled>): AdminState {
  const updated = action.payload.adminUserRow;
  return { ...state, users: state.users.map((u) => (u.id === updated.id ? updated : u)) };
}

// updateUserRole
function handleAdminUpdateUserRoleSuccess(state: AdminState, action: ReturnType<typeof adminUpdateUserRoleFulfilled>): AdminState {
  const updated = action.payload.adminUserRow;
  return { ...state, users: state.users.map((u) => (u.id === updated.id ? updated : u)) };
}

// updatePlatformToken
function handleAdminUpdatePlatformTokenStart(state: AdminState, action: ReturnType<typeof adminUpdatePlatformTokenPending>): AdminState {
  const { platformID } = action.payload;
  return {
    ...state,
    platformsTokens: {
      ...state.platformsTokens,
      [platformID]: { ...state.platformsTokens[platformID], isLoading: true },
    },
  };
}
function handleAdminUpdatePlatformTokenSuccess(state: AdminState, action: ReturnType<typeof adminUpdatePlatformTokenFulfilled>): AdminState {
  const updated = action.payload;
  return {
    ...state,
    platformsTokens: {
      ...state.platformsTokens,
      [updated.id]: { isLoading: false, token: updated.token, tokenValidityFrame: updated.tokenValidityFrame, dateSet: updated.dateSet },
    },
  };
}
function handleAdminUpdatePlatformTokenFailure(state: AdminState, action: ReturnType<typeof adminUpdatePlatformTokenRejected>): AdminState {
  const { platformID } = action.meta.arg;
  return {
    ...state,
    platformsTokens: {
      ...state.platformsTokens,
      [platformID]: { ...state.platformsTokens[platformID], isLoading: false },
    },
  };
}

// triggerUserSync
function handleAdminTriggerUserSyncStart(state: AdminState, _action: ReturnType<typeof adminTriggerUserSyncPending>): AdminState {
  return { ...state, mutationStatus: AsyncStatus.Loading };
}
function handleAdminTriggerUserSyncSuccess(state: AdminState, _action: ReturnType<typeof adminTriggerUserSyncFulfilled>): AdminState {
  return { ...state, mutationStatus: AsyncStatus.Succeeded };
}
function handleAdminTriggerUserSyncFailure(state: AdminState, action: ReturnType<typeof adminTriggerUserSyncRejected>): AdminState {
  return { ...state, mutationStatus: AsyncStatus.Failed, error: action.payload.error };
}

export default adminReducer;