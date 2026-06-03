import { Platform, Role } from '@grimoire/shared';

export type AdminUserRow = {
  id: string;
  email: string;
  name?: string;
  role: Role;
  plan: string;
  mustChangePassword: boolean;
  aiEnabled: boolean;
  aiRequestsUsed: number;
  aiRequestsLimit: number | null;
  gamesCount: number;
  createdAt: string;
};

export type AdminUserListResponse = {
  data: AdminUserRow[];
  total: number;
};

export type AiGlobalSettings = {
  aiEnabled: boolean;
};

export type PlatformTokenEntry = {
  isLoading: false;
  token: string;
  tokenValidityFrame: number;
  dateSet: Date;
};

export type PlatformTokenInfo = Partial<Record<Platform, PlatformTokenEntry>>;

export type CreateUserArgs = {
  email: string;
  password: string;
  name?: string;
};

export type UpdateUserAiArgs = {
  id: string;
  aiEnabled: boolean;
  aiRequestsLimit: number | null;
};

export type UpdateAiGlobalArgs = {
  aiEnabled: boolean;
};

export type UpdateUserPlanArgs = {
  id: string;
  plan: string;
};

export type UpdateUserRoleArgs = {
  userID: string;
  role: Role;
};

export type UpdatePlatformTokenArgs = {
  platformID: Platform;
  token: string;
  tokenValidityFrame: number;
};

export type SetupAdminArgs = {
  email: string;
  password: string;
  name?: string;
};

export type TriggerUserSyncArgs = {
  userID: string;
};
