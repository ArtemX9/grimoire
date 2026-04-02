export interface AdminUserResponse {
  id: string;
  email: string;
  name?: string;
  role: string;
  plan: string;
  mustChangePassword: boolean;
  aiEnabled: boolean;
  aiRequestsUsed: number;
  aiRequestsLimit: number | null;
  gamesCount: number;
  createdAt: Date;
}

export interface AdminUserListResponse {
  data: AdminUserResponse[];
  total: number;
}

export interface AdminStatsResponse {
  users: Array<{
    id: string;
    email: string;
    name?: string;
    gamesCount: number;
    sessionsCount: number;
    aiRequestsUsed: number;
    aiRequestsLimit: number | null;
  }>;
}

export interface AiSettingsResponse {
  globalEnabled: boolean;
  updatedUser?: AdminUserResponse;
}
