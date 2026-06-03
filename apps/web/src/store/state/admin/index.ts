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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adminReducer(state = initialState, rawAction: any): AdminState {
  const action = rawAction as AdminAction;
  switch (action.type) {
    // fetchAdminUsers
    case ADMIN_FETCH_USERS_PENDING:
      return { ...state, usersStatus: AsyncStatus.Loading, error: null };
    case ADMIN_FETCH_USERS_FULFILLED:
      return {
        ...state,
        usersStatus: AsyncStatus.Succeeded,
        users: action.payload.data,
        usersTotal: action.payload.total,
      };
    case ADMIN_FETCH_USERS_REJECTED:
      return { ...state, usersStatus: AsyncStatus.Failed, error: action.error };

    // fetchAiGlobalSettings
    case ADMIN_FETCH_AI_SETTINGS_PENDING:
      return { ...state, aiSettingsStatus: AsyncStatus.Loading, error: null };
    case ADMIN_FETCH_AI_SETTINGS_FULFILLED:
      return { ...state, aiSettingsStatus: AsyncStatus.Succeeded, aiSettings: action.payload };
    case ADMIN_FETCH_AI_SETTINGS_REJECTED:
      return { ...state, aiSettingsStatus: AsyncStatus.Failed, error: action.error };

    // fetchPlatformsTokens
    case ADMIN_FETCH_PLATFORMS_TOKENS_PENDING:
      return { ...state, platformsTokensStatus: AsyncStatus.Loading, error: null };
    case ADMIN_FETCH_PLATFORMS_TOKENS_FULFILLED:
      return { ...state, platformsTokensStatus: AsyncStatus.Succeeded, platformsTokens: action.payload };
    case ADMIN_FETCH_PLATFORMS_TOKENS_REJECTED:
      return { ...state, platformsTokensStatus: AsyncStatus.Failed, error: action.error };

    // createAdminUser
    case ADMIN_CREATE_USER_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading, error: null };
    case ADMIN_CREATE_USER_FULFILLED:
      return {
        ...state,
        mutationStatus: AsyncStatus.Succeeded,
        users: [action.payload, ...state.users],
        usersTotal: state.usersTotal + 1,
      };
    case ADMIN_CREATE_USER_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    // deleteAdminUser
    case ADMIN_DELETE_USER_FULFILLED:
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.meta.arg),
        usersTotal: Math.max(0, state.usersTotal - 1),
      };

    // updateAiGlobalSettings
    case ADMIN_UPDATE_AI_SETTINGS_FULFILLED: {
      if (!state.aiSettings) return state;
      return {
        ...state,
        aiSettings: { ...state.aiSettings, aiEnabled: action.meta.arg.aiEnabled },
      };
    }

    // updateUserAiSettings
    case ADMIN_UPDATE_USER_AI_SETTINGS_FULFILLED: {
      const { id, aiEnabled, aiRequestsLimit } = action.meta.arg;
      return {
        ...state,
        users: state.users.map((u) => (u.id === id ? { ...u, aiEnabled, aiRequestsLimit } : u)),
      };
    }

    // updateUserPlan
    case ADMIN_UPDATE_USER_PLAN_FULFILLED: {
      const updated = action.payload;
      return {
        ...state,
        users: state.users.map((u) => (u.id === updated.id ? updated : u)),
      };
    }

    // updateUserRole
    case ADMIN_UPDATE_USER_ROLE_FULFILLED: {
      const updated = action.payload;
      return {
        ...state,
        users: state.users.map((u) => (u.id === updated.id ? updated : u)),
      };
    }

    // updatePlatformToken
    case ADMIN_UPDATE_PLATFORM_TOKEN_PENDING: {
      const { platformID } = action.meta.arg;
      return {
        ...state,
        platformsTokens: {
          ...state.platformsTokens,
          [platformID]: {
            ...state.platformsTokens[platformID],
            isLoading: true,
          },
        },
      };
    }

    case ADMIN_UPDATE_PLATFORM_TOKEN_FULFILLED: {
      const updated = action.payload;
      return {
        ...state,
        platformsTokens: {
          ...state.platformsTokens,
          [updated.id]: {
            isLoading: false,
            token: updated.token,
            tokenValidityFrame: updated.tokenValidityFrame,
            dateSet: updated.dateSet,
          },
        },
      };
    }

    case ADMIN_UPDATE_PLATFORM_TOKEN_REJECTED: {
      const { platformID } = action.meta.arg;
      return {
        ...state,
        platformsTokens: {
          ...state.platformsTokens,
          [platformID]: {
            ...state.platformsTokens[platformID],
            isLoading: false,
          },
        },
      };
    }

    // triggerUserSync
    case ADMIN_TRIGGER_USER_SYNC_PENDING:
      return { ...state, mutationStatus: AsyncStatus.Loading };
    case ADMIN_TRIGGER_USER_SYNC_FULFILLED:
      return { ...state, mutationStatus: AsyncStatus.Succeeded };
    case ADMIN_TRIGGER_USER_SYNC_REJECTED:
      return { ...state, mutationStatus: AsyncStatus.Failed, error: action.error };

    default:
      return state;
  }
}

export default adminReducer;
